"use client";

import { trpc } from "@/app/_trpc/client";
import MaxWidthWrapper from "@/components/MaxWidthWrapper";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/use-toast";
import { getMemberStatus } from "@/lib/xendit/xendit";
import { upperFirst } from "@mantine/hooks";
import { format } from "date-fns";
import { HelpCircle, Loader2 } from "lucide-react";

interface SubscriptionDetailsProps {
  subscriptionPlan: Awaited<ReturnType<typeof getMemberStatus>>;
}

const SubscriptionDetails = ({
  subscriptionPlan,
}: SubscriptionDetailsProps) => {
  const { toast } = useToast();

  const { mutate: createXenditSession, isLoading } =
    trpc.createXenditSession.useMutation({
      onSuccess: (res) => {
        if (res?.data) window.location.href = res?.data;
        if (!res?.data) {
          toast({
            title: "There was a problem...",
            description: "Please try again in a moment",
            variant: "destructive",
          });
        }
      },
    });
  return (
    <MaxWidthWrapper className="max-w-5xl">
      <TooltipProvider>
        <form
          className="mt-12"
          onSubmit={(e) => {
            e.preventDefault();
            createXenditSession({
              memberType:
                subscriptionPlan.membershipType === "free" ? "pro" : "business",
            });
          }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Subscription Plan</CardTitle>
              <CardDescription>
                You are currently on the{" "}
                <strong>{subscriptionPlan.membershipType}</strong> plan.
              </CardDescription>
            </CardHeader>

            <CardFooter className="flex flex-col items-start space-y-2 md:flex-row md:justify-between md:space-x-0">
              <Button type="submit" variant="ghost" size="sm">
                {isLoading ? (
                  <Loader2 className="mr-4 h-4 w-4 animate-spin" />
                ) : null}
                {subscriptionPlan.isMember ? "Renew in Advance" : "Upgrade"}
              </Button>
              <Tooltip delayDuration={300}>
                <TooltipTrigger className="cursor-default ml-1.5" type="button">
                  <HelpCircle className="h-4 w-4 text-zinc-500" />
                </TooltipTrigger>
                <TooltipContent className="w-40 p-2">
                  If you renew your plan in advance, we will add another 30 days
                  to your plan expiry date.
                </TooltipContent>
              </Tooltip>
            </CardFooter>
          </Card>
        </form>
        <Card className="mt-2">
          <CardHeader>
            <CardTitle>Subscription Details</CardTitle>
            <CardDescription>Manage your pricing plan.</CardDescription>
          </CardHeader>
          <CardFooter>
            <Table>
              <TableCaption>
                Your plan will expires on{" "}
                {format(
                  new Date(subscriptionPlan.membershipEnd!),
                  "dd-MM-yyyy"
                )}
                .
              </TableCaption>
              <TableBody>
                <TableRow>
                  <TableCell className="font-normal">Plan</TableCell>
                  <TableCell className="font-normal"></TableCell>
                  <TableCell className="font-medium">
                    <Badge variant="outline" className="rounded-md">
                      {upperFirst(subscriptionPlan.membershipType)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <p
                      className="text-blue-600 cursor-pointer"
                      onClick={() => console.log("test")}
                    >
                      Upgrade
                    </p>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={2}>Max upload size</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="rounded-md">
                      16MB
                    </Badge>
                  </TableCell>
                  <TableCell></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={2}>Max characters per question</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="rounded-md">
                      400
                    </Badge>
                  </TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableBody>
              <TableFooter></TableFooter>
            </Table>
          </CardFooter>
        </Card>
      </TooltipProvider>
    </MaxWidthWrapper>
  );
};

export default SubscriptionDetails;
