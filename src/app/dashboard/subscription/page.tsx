import BillingForm from "@/components/dashboard/billing/BillingForm";
import { getMemberStatus } from "@/lib/xendit/xendit";

const Page = async () => {
  const subscriptionPlan = await getMemberStatus();

  return <BillingForm subscriptionPlan={subscriptionPlan} />;
};

export default Page;
