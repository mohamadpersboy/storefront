import { Badge } from "@/components/ui/badge";
import type { MockOrderStatus } from "@/lib/mock/dashboard";

const statusConfig: Record<
  MockOrderStatus,
  { label: string; tone: "neutral" | "success" | "warning" | "danger" | "primary" }
> = {
  pending: { label: "در انتظار بررسی", tone: "warning" },
  confirmed: { label: "تأییدشده", tone: "primary" },
  processing: { label: "در حال پردازش", tone: "primary" },
  shipped: { label: "ارسال‌شده", tone: "neutral" },
  delivered: { label: "تحویل‌شده", tone: "success" },
  cancelled: { label: "لغوشده", tone: "danger" },
};

export function OrderStatusBadge({ status }: { status: MockOrderStatus }) {
  const config = statusConfig[status];
  return <Badge tone={config.tone}>{config.label}</Badge>;
}
