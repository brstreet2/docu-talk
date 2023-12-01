"use client";

import { trpc } from "@/app/_trpc/client";
import InputMessage from "./InputMessage";
import Messages from "./Messages";
import { ChevronLeft, Download, Loader2, XCircle } from "lucide-react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { MessageContextProvider } from "./MessageContext";

interface MessagesWrapperProps {
  fileId: string;
}

const MessagesWrapper = ({ fileId }: MessagesWrapperProps) => {
  const { data, isLoading } = trpc.getFileUploadStatus.useQuery(
    {
      fileId,
    },
    {
      refetchInterval: (data) =>
        data?.status === "SUCCESS" || data?.status === "FAILED" ? false : 500,
    }
  );

  const membershipPlan = trpc.getMembershipStatus.useQuery();

  if (isLoading)
    return (
      <div className="relative bg-zinc-50 flex divide-y divide-zinc-200 flex-col justify-between gap-2">
        <div className="flex-1 flex justify-center items-center flex-col mb-28">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
            <h3 className="font-semibold text-xl">Loading ...</h3>
            <p className="text-zinc-500 text-sm">
              We&apos;re preparing your PDF.
            </p>
          </div>
        </div>

        <InputMessage isDisabled isMember={membershipPlan.data?.isMember} />
      </div>
    );

  if (data?.status === "PROCESSING")
    return (
      <div className="relative min-h-full bg-zinc-50 flex divide-y divide-zinc-200 flex-col justify-between gap-2">
        <div className="flex-1 flex justify-center items-center flex-col mb-28">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
            <h3 className="font-semibold text-xl">Processing PDF ...</h3>
            <p className="text-zinc-500 text-sm">This won&apos;t take long.</p>
          </div>
        </div>

        <InputMessage isDisabled isMember={membershipPlan.data?.isMember} />
      </div>
    );

  if (data?.status === "FAILED")
    return (
      <div className="relative min-h-full bg-zinc-50 flex divide-y divide-zinc-200 flex-col justify-between gap-2">
        <div className="flex-1 flex justify-center items-center flex-col mb-28">
          <div className="flex flex-col items-center gap-2">
            <XCircle className="h-8 w-8 text-red-500" />
            <h3 className="font-semibold text-xl">Too many pages in the PDF</h3>
            <p className="text-zinc-500 text-sm">
              Your <span className="font-medium">Free</span> plan supports up to
              5 pages per PDF.
            </p>
            <Link
              href="/dashboard"
              className={buttonVariants({
                variant: "secondary",
                className: "mt-4",
              })}
            >
              <ChevronLeft className="h-3 w-3 mr-1.5" />
              Back
            </Link>
          </div>
        </div>

        <InputMessage isDisabled isMember={membershipPlan.data?.isMember} />
      </div>
    );

  return (
    <MessageContextProvider fileId={fileId}>
      <div className="relative bg-zinc-50 flex flex-col justify-between h-full p-6 gap-4">
        <div className="h-auto flex justify-end">
          <Button variant="ghost">
            <Download />
          </Button>
        </div>

        <div className="flex-1">
          <Messages fileId={fileId} />
        </div>
        <div className="h-auto">
          <InputMessage isMember={membershipPlan.data?.isMember} />
        </div>
      </div>
    </MessageContextProvider>
  );
};

export default MessagesWrapper;
