import { db } from "@/db";
import { NextRequest, NextResponse } from "next/server";
import addDays from "date-fns/addDays";

export const POST = async (req: NextRequest) => {
  const body = await req.json();

  const { external_id, id: xenditId, amount: typePrice } = body;

  const isTransactionExists = await db.transaction.findFirst({
    where: {
      id: external_id,
      xenditTransactionId: xenditId,
      transactionStatus: "PENDING",
    },
  });

  if (!isTransactionExists) {
    return NextResponse.json(
      {
        error: false,
        message: "No Transaction.",
        data: null,
      },
      {
        status: 200,
      }
    );
  }

  const userId = isTransactionExists.userId;

  const dbUser = await db.user.findFirst({
    where: {
      id: userId!,
    },
  });

  if (!dbUser) {
    return NextResponse.json(
      {
        error: false,
        message: "No user found.",
        data: null,
      },
      {
        status: 200,
      }
    );
  }

  if (dbUser.isMember !== true && dbUser.membershipType === "free") {
    try {
      await db.$transaction([
        db.transaction.update({
          where: {
            id: external_id,
            xenditTransactionId: xenditId,
            transactionStatus: "PENDING",
          },
          data: {
            transactionStatus: "PAID",
          },
        }),
        db.user.update({
          where: {
            id: userId!,
          },
          data: {
            isMember: true,
            membershipType: typePrice === 50000 ? "pro" : "premium",
            membershipEnd: addDays(new Date(), 30),
          },
        }),
      ]);
      return NextResponse.json(
        { error: false, message: "OK", data: null },
        { status: 200 }
      );
    } catch (e) {
      console.log(e);
      return NextResponse.json(
        { error: true, message: "ERROR", data: [e] },
        { status: 500 }
      );
    }
  } else {
    try {
      var newExpiredDate = dbUser.membershipEnd?.toDateString();
      await db.$transaction([
        db.transaction.update({
          where: {
            id: external_id,
            xenditTransactionId: xenditId,
            transactionStatus: "PENDING",
          },
          data: {
            transactionStatus: "PAID",
          },
        }),
        db.user.update({
          where: {
            id: userId!,
          },
          data: {
            membershipType: typePrice === 50000 ? "pro" : "premium",
            membershipEnd: addDays(new Date(newExpiredDate!), 30),
          },
        }),
      ]);
      return NextResponse.json(
        { error: false, message: "OK", data: null },
        { status: 200 }
      );
    } catch (e) {
      console.log(e);
      return NextResponse.json(
        { error: true, message: "ERROR", data: [e] },
        { status: 500 }
      );
    }
  }
};
