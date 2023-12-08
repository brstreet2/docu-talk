import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { Xendit, Invoice as InvoiceClient } from "xendit-node";
import { PLANS } from "@/config/plans";
import { db } from "@/db";
import { CreateInvoiceRequest, Invoice } from "xendit-node/invoice/models";

export const xenditClient = new Xendit({
  secretKey: process.env.XENDIT_SECRET!,
});

export const xenditInvoiceClient = new InvoiceClient({
  secretKey: process.env.XENDIT_SECRET!,
});

export async function getMemberStatus() {
  const { getUser } = getKindeServerSession();
  const user = await getUser();

  if (!user?.id) {
    return {
      ...PLANS[0],
      isMember: false,
      membershipType: "free",
      membershipEnd: null,
    };
  }

  const dbUser = await db.user.findFirst({
    where: {
      id: user.id,
    },
  });

  if (!dbUser) {
    return {
      ...PLANS[0],
      isMember: false,
      membershipType: "free",
      membershipEnd: null,
    };
  }

  const isValidMember = Boolean(
    dbUser.isMember &&
      dbUser.membershipEnd && // 86400000 = 1 day
      dbUser.membershipEnd.getTime() + 86_400_000 > Date.now()
  );

  if (!isValidMember) {
    const updatedUser = await db.user.update({
      where: {
        id: dbUser.id,
      },
      data: {
        isMember: false,
        membershipType: "free",
        membershipEnd: null,
      },
    });
    let response = {
      isMember: updatedUser.isMember,
      membershipType: updatedUser.membershipType,
      membershipEnd: updatedUser.membershipEnd,
    };
    return response;
  }

  return {
    isMember: dbUser.isMember,
    membershipType: dbUser.membershipType,
    membershipEnd: dbUser.membershipEnd,
    isValidMember,
  };
}

export async function createPayment(userId: string, member_type: string) {
  const payload: CreateInvoiceRequest = {
    amount: member_type === "pro" ? 50000 : 75000,
    invoiceDuration: "172800",
    externalId: userId,
    description:
      member_type === "pro" ? "Pro Membership" : "Premium Membership",
    currency: "IDR",
    fees: [{ type: "Platform Fee", value: 4440 }],
    successRedirectUrl: "/dashboard",
  };

  const response: Invoice = await xenditInvoiceClient.createInvoice({
    data: payload,
  });

  return response;
}
