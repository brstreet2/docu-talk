import BillingForm from "@/components/dashboard/billing/BillingForm";
import { db } from "@/db";
import { getMemberStatus } from "@/lib/xendit/xendit";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { redirect } from "next/navigation";

const Page = async () => {
  const { getUser } = getKindeServerSession();
  const user = await getUser();

  if (!user || !user.id)
    redirect("/auth-callback?origin=dashboard/subscription");

  const dbUser = await db.user.findFirst({
    where: {
      id: user.id,
    },
  });

  if (!dbUser) redirect("/auth-callback?origin=dashboard/subscription");

  const subscriptionPlan = await getMemberStatus();

  return <BillingForm subscriptionPlan={subscriptionPlan} />;
};

export default Page;
