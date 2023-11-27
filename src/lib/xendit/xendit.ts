import { PLANS } from "@/config/plans";
import { db } from "@/db";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/dist/types/server";
import { Xendit } from "xendit-node";

export const xenditClient = new Xendit({
  secretKey: process.env.XENDIT_SECRET!,
});

export async function getUserPlan() {
  const { getUser } = getKindeServerSession();
  const user = await getUser();

  if (!user?.id) {
    return {
      ...PLANS[0],
      isSubscribed: false,
      isCanceled: false,
      memberEnd: null,
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
      isSubscribed: false,
      isCanceled: false,
      memberEnd: null,
    };
  }

  const dbTransaction = await db.transaction.findFirst({
    where: {
      userId: user.id,
      transactionStatus: "SETTLED",
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (!dbTransaction) {
    return {
      ...PLANS[0],
      isSubscribed: false,
      isCanceled: false,
      memberEnd: null,
    };
  }

  const isSubscribed = Boolean(
    dbUser.isMember &&
      dbUser.membershipEnd && // 86400000 = 1 day
      dbUser.membershipEnd.getTime() + 86_400_000 > Date.now()
  );

  const plan = isSubscribed
    ? PLANS.find((plan) => plan.slug === dbUser.membershipType)
    : null;

  return {
    ...plan,
    isSubscribed,
  };
}
