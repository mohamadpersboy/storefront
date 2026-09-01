import { Badge } from "@/components/ui/badge";
import type { OrderStatus } from "@/lib/constants/order-status";

const statusConfig: Record<
  OrderStatus,
  { label: string; tone: "neutral" | "success" | "warning" | "danger" | "primary" }
> = {
  pending: { label: "در انتظار بررسی", tone: "warning" },
  confirmed: { label: "تأییدشده", tone: "primary" },
  processing: { label: "در حال پردازش", tone: "primary" },
  ready_to_ship: { label: "آماده ارسال", tone: "primary" },
  shipped: { label: "ارسال‌شده", tone: "neutral" },
  delivered: { label: "تحویل‌شده", tone: "success" },
  cancelled: { label: "لغوشده", tone: "danger" },
  returned: { label: "مرجوعی", tone: "danger" },
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const config = statusConfig[status] ?? { label: "نامشخص", tone: "neutral" as const };
  return <Badge tone={config.tone}>{config.label}</Badge>;
}

export const orderStatusLabels: Record<OrderStatus, string> = Object.fromEntries(
  Object.entries(statusConfig).map(([key, val]) => [key, val.label]),
) as Record<OrderStatus, string>;
