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
}
