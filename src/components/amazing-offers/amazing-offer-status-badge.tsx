import { Badge } from "@/components/ui/badge";
import type { AmazingOfferComputedStatus } from "@/lib/utils/amazing-offer";

const statusConfig: Record<
  AmazingOfferComputedStatus,
  { label: string; tone: "neutral" | "success" | "warning" | "danger" }
> = {
  active: { label: "فعال", tone: "success" },
  scheduled: { label: "زمان‌بندی‌شده", tone: "warning" },
  expired: { label: "منقضی‌شده", tone: "neutral" },
  paused: { label: "متوقف‌شده", tone: "danger" },
};

export function AmazingOfferStatusBadge({ status }: { status: AmazingOfferComputedStatus }) {
  const config = statusConfig[status];
  return <Badge tone={config.tone}>{config.label}</Badge>;
}
