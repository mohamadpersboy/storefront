import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Card } from "@/components/ui/card";

export function KpiCard({
  label,
  value,
  icon: Icon,
  tone = "neutral",
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  tone?: "neutral" | "warning" | "danger";
}) {
  const iconToneClasses = {
    neutral: "bg-primary-soft text-primary",
    warning: "bg-amber-50 text-amber-600",
    danger: "bg-red-50 text-danger",
  }[tone];

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted">{label}</p>
        <span
          className={cn(
            "flex size-8 items-center justify-center rounded-[var(--radius-md)]",
            iconToneClasses,
          )}
        >
          <Icon className="size-4" strokeWidth={1.75} />
        </span>
      </div>
      <p className="mt-3 text-2xl font-semibold tabular-nums text-foreground">
        {value}
      </p>
    </Card>
  );
}
