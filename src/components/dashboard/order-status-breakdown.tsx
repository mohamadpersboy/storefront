import { toPersianDigits } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

const toneBarClasses = {
  neutral: "bg-zinc-400",
  primary: "bg-primary",
  success: "bg-green-500",
  warning: "bg-amber-500",
  danger: "bg-red-500",
};

export function OrderStatusBreakdown({
  data,
}: {
  data: Array<{
    status: string;
    value: number;
    tone: keyof typeof toneBarClasses;
  }>;
}) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="flex flex-col gap-3">
      {data.map((item) => {
        const percent = total > 0 ? (item.value / total) * 100 : 0;
        return (
          <div key={item.status}>
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className="text-foreground/80">{item.status}</span>
              <span className="tabular-nums text-muted">
                {toPersianDigits(item.value)}
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-subtle">
              <div
                className={cn(
                  "h-full rounded-full",
                  toneBarClasses[item.tone],
                )}
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
