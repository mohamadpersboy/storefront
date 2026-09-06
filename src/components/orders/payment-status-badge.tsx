import { Badge } from "@/components/ui/badge";
import type { PaymentStatus } from "@/models/Payment";

const statusConfig: Record<
  PaymentStatus,
  { label: string; tone: "neutral" | "success" | "warning" | "danger" | "primary" }
> = {
  pending: { label: "در انتظار پرداخت", tone: "warning" },
  processing: { label: "در حال پردازش", tone: "primary" },
  paid: { label: "پرداخت‌شده", tone: "success" },
  failed: { label: "ناموفق", tone: "danger" },
  cancelled: { label: "لغوشده", tone: "danger" },
  refunded: { label: "بازگشت‌داده‌شده", tone: "neutral" },
  partially_paid: { label: "پرداخت جزئی", tone: "warning" },
  returned: { label: "عودت داده‌شده", tone: "neutral" },
};

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const config = statusConfig[status] ?? { label: "نامشخص", tone: "neutral" as const };
  return <Badge tone={config.tone}>{config.label}</Badge>;
}
