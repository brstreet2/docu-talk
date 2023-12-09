"use client";

import { trpc } from "@/app/_trpc/client";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";
import { format } from "date-fns";
import { getMemberStatus } from "@/lib/xendit/xendit";
import MaxWidthWrapper from "@/components/MaxWidthWrapper";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import SubscriptionDetails from "./SubscriptionDetails";

interface BillingFormProps {
  subscriptionPlan: Awaited<ReturnType<typeof getMemberStatus>>;
}

const BillingForm = ({ subscriptionPlan }: BillingFormProps) => {
  const outStandingPayment = trpc.getOutstandingPayment.useQuery();

  if (outStandingPayment.data?.data === null) {
    return <SubscriptionDetails subscriptionPlan={subscriptionPlan} />;
  } else {
    return (
      <MaxWidthWrapper className="max-w-5xl">
        <TooltipProvider>
          <Card>
            <CardHeader>
              <CardTitle>Billing</CardTitle>
              <CardDescription>
                You have an outstanding <strong>payment</strong>.
              </CardDescription>
              <Table className="mt-4">
                <TableCaption>A list of your recent invoices.</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Item</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">
                      {outStandingPayment.data?.data.amount! > 75000
                        ? "Pro"
                        : "Premium"}
                    </TableCell>
                    <TableCell>
                      {outStandingPayment.data?.data.description}
                    </TableCell>
                    <TableCell>
                      {outStandingPayment.data?.data.transactionStatus}
                    </TableCell>
                    <TableCell>1</TableCell>
                    <TableCell className="text-right">
                      {new Intl.NumberFormat("id-ID", {
                        style: "currency",
                        currency: "IDR",
                      }).format(outStandingPayment.data?.data.amount!)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Fee</TableCell>
                    <TableCell>Payment Gateway Platform Fee</TableCell>
                    <TableCell></TableCell>
                    <TableCell>1</TableCell>
                    <TableCell className="text-right">
                      {new Intl.NumberFormat("id-ID", {
                        style: "currency",
                        currency: "IDR",
                      }).format(4440)}
                    </TableCell>
                  </TableRow>
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={4}>Total</TableCell>
                    <TableCell className="text-right">
                      {" "}
                      {new Intl.NumberFormat("id-ID", {
                        style: "currency",
                        currency: "IDR",
                      }).format(outStandingPayment.data?.data.amount! + 4440)}
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </CardHeader>

            <CardFooter className="flex flex-col items-start space-y-2 md:flex-row md:justify-between md:space-x-0">
              <Button variant="ghost" size="sm">
                Pay Now
              </Button>
              <Tooltip delayDuration={300}>
                <TooltipTrigger className="cursor-default ml-1.5" type="button">
                  <HelpCircle className="h-4 w-4 text-zinc-500" />
                </TooltipTrigger>
                <TooltipContent className="w-40 p-2">
                  If you don't pay your bills before{" "}
                  {format(
                    new Date(subscriptionPlan.membershipEnd!),
                    "dd-MM-yyyy"
                  )}{" "}
                  your transaction will be cancelled.
                </TooltipContent>
              </Tooltip>
            </CardFooter>
          </Card>
        </TooltipProvider>
      </MaxWidthWrapper>
    );
  }
};

export default BillingForm;
