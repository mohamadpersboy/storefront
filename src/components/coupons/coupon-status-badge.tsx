import { Badge } from "@/components/ui/badge";

export function CouponStatusBadge({
  status,
  isExpired,
}: {
  status: "active" | "inactive";
  isExpired: boolean;
}) {
  if (isExpired) {
    return <Badge tone="neutral">منقضی‌شده</Badge>;
  }
  if (status === "active") {
    return <Badge tone="success">فعال</Badge>;
  }
  return <Badge tone="danger">غیرفعال</Badge>;
}
