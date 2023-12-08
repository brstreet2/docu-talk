"use client";

import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "../ui/button";
import { trpc } from "@/app/_trpc/client";
import { useState } from "react";

interface UpgradeButtonProps {
  memberType: string;
}

const UpgradeButton = ({ memberType }: UpgradeButtonProps) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { mutate: createXenditSession } = trpc.createXenditSession.useMutation({
    onMutate: () => {
      setIsLoading(true);
    },
    onSuccess: (response) => {
      setIsLoading(false);
    },
    onError: (response) => {
      console.log(response);
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
