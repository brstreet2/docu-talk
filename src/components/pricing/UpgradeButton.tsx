"use client";

import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "../ui/button";
import { trpc } from "@/app/_trpc/client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "../ui/use-toast";

interface UpgradeButtonProps {
  memberType: string;
}

const UpgradeButton = ({ memberType }: UpgradeButtonProps) => {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { mutate: createXenditSession } = trpc.createXenditSession.useMutation({
    onMutate: () => {
      setIsLoading(true);
    },
    onSuccess: (response) => {
      router.push("/dashboard/subscription");
    },
    onError: (response) => {
      console.log(response);
      toast({
        title: "There was a problem...",
        description: "Please try again in a moment",
        variant: "destructive",
      });
      setIsLoading(false);
    },
  });

  return (
    <Button
      className="w-full"
      disabled={isLoading ? true : false}
      onClick={() => createXenditSession({ memberType })}
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
        </>
      ) : (
        <>
          Upgrade Now <ArrowRight className="h-5 w-5 ml-1.5" />
        </>
      )}
    </Button>
  );
};

export default UpgradeButton;
