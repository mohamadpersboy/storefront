import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-4 lg:gap-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="p-5">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="mt-4 h-7 w-28" />
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6">
        <Card className="p-5 lg:col-span-2">
          <Skeleton className="h-64 w-full" />
        </Card>
        <Card className="p-5">
          <Skeleton className="h-64 w-full" />
        </Card>
      </div>
    </div>
  );
}
