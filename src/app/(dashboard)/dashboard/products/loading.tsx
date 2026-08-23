import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function ProductsLoading() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <Skeleton className="h-11 flex-1" />
        <Skeleton className="h-11 sm:w-44" />
        <Skeleton className="h-11 sm:w-32" />
      </div>
      <Card className="p-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="mb-3 h-14 w-full last:mb-0" />
        ))}
      </Card>
    </div>
  );
}
