import { Badge } from "@/components/ui/badge";
import type { ProductStatus } from "@/models/Product";

const statusConfig: Record<
  ProductStatus,
  { label: string; tone: "neutral" | "success" | "warning" }
> = {
  draft: { label: "پیش‌نویس", tone: "warning" },
  published: { label: "منتشرشده", tone: "success" },
  archived: { label: "بایگانی‌شده", tone: "neutral" },
};

export function ProductStatusBadge({ status }: { status: ProductStatus }) {
  const config = statusConfig[status];
  return <Badge tone={config.tone}>{config.label}</Badge>;
}
