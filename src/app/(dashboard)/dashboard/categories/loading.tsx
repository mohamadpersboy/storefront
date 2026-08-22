import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function CategoriesLoading() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-9 w-36 self-end" />
      <Card className="p-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="mb-3 h-10 w-full last:mb-0" />
        ))}
      </Card>
    </div>
  );
}
