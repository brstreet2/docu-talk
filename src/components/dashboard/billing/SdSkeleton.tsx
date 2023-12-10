import MaxWidthWrapper from "@/components/MaxWidthWrapper";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Skeleton from "react-loading-skeleton";

const SdSkeleton = () => {
  return (
    <MaxWidthWrapper className="max-w-5xl">
      <form className="mt-12">
        <Card>
          <CardHeader>
            <CardTitle>
              <Skeleton />
            </CardTitle>
            <CardDescription>
              <Skeleton />
            </CardDescription>
            <Skeleton count={3} />
          </CardHeader>

          <CardFooter className="flex flex-col items-start space-y-2 md:flex-row md:justify-between md:space-x-0">
            <Button type="submit" variant="ghost" size="sm">
              <Skeleton />
            </Button>
          </CardFooter>
        </Card>
      </form>
      <Card className="mt-2">
        <CardHeader>
          <CardTitle>
            <Skeleton />
          </CardTitle>
          <CardDescription>
            <Skeleton count={5} />
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Skeleton />
        </CardFooter>
      </Card>
    </MaxWidthWrapper>
  );
};

export default SdSkeleton;
