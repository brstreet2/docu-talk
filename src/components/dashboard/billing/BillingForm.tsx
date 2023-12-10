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
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import Skeleton from "react-loading-skeleton";

interface BillingFormProps {
  subscriptionPlan: Awaited<ReturnType<typeof getMemberStatus>>;
}

const BillingForm = ({ subscriptionPlan }: BillingFormProps) => {
  const { toast } = useToast();
  const { data: outstandingPayment, isLoading } =
    trpc.getOutstandingPayment.useQuery();

  const handlePay = (url: string) => {
    if (!url) {
      toast({
        title: "There was a problem...",
        description: "Please try again in a moment",
        variant: "destructive",
      });
    }
    window.location.href = url;
  };

  if (outstandingPayment?.data === null) {
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
                    {isLoading ? (
                      <TableCell colSpan={5}>
                        <Skeleton />
                      </TableCell>
                    ) : (
                      <>
                        <TableCell className="font-medium">
                          {outstandingPayment?.data.amount! > 75000
                            ? "Pro"
                            : "Premium"}
                        </TableCell>
                        <TableCell>
                          {outstandingPayment?.data.description}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="rounded-sm">
                            {outstandingPayment?.data.transactionStatus}
                          </Badge>
                        </TableCell>
                        <TableCell>1</TableCell>
                        <TableCell className="text-right">
                          {new Intl.NumberFormat("id-ID", {
                            style: "currency",
                            currency: "IDR",
                          }).format(outstandingPayment?.data.amount!)}
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                  <TableRow>
                    {isLoading ? (
                      <TableCell colSpan={5}>
                        <Skeleton />
                      </TableCell>
                    ) : (
                      <>
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
                      </>
                    )}
                  </TableRow>
                </TableBody>
                <TableFooter>
                  <TableRow>
                    {isLoading ? (
                      <TableCell colSpan={5}>
                        <Skeleton />
                      </TableCell>
                    ) : (
                      <>
                        <TableCell colSpan={4}>Total</TableCell>
                        <TableCell className="text-right">
                          {" "}
                          {new Intl.NumberFormat("id-ID", {
                            style: "currency",
                            currency: "IDR",
                          }).format(outstandingPayment?.data.amount! + 4440)}
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                </TableFooter>
              </Table>
            </CardHeader>

            <CardFooter className="flex flex-col items-start space-y-2 md:flex-row md:justify-between md:space-x-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  handlePay(outstandingPayment?.data.xenditInvoiceUrl!);
                }}
              >
                Pay Now
              </Button>
              <Tooltip delayDuration={300}>
                <TooltipTrigger className="cursor-default ml-1.5" type="button">
                  <HelpCircle className="h-4 w-4 text-zinc-500" />
                </TooltipTrigger>
                <TooltipContent className="w-45 p-2">
                  If you don&apos;t pay your bills before{" "}
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
