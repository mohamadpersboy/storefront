import type { OrderStatus } from "@/lib/constants/order-status";
import { orderStatusLabels } from "@/components/orders/order-status-badge";

/**
 * Badge وضعیت سفارش مخصوص Storefront — عمداً از
 * `components/orders/order-status-badge.tsx` (که با وجود اسم پوشه،
 * فقط داخل Dashboard مصرف می‌شود: `orders-page-client`،
 * `order-detail-card`، `customer-detail-card`) جدا است، چون آن
 * Badge از `components/ui/badge` با پالت رنگی Dashboard (Indigo)
 * می‌آید و اینجا باید با زبان بصری Storefront (رنگ‌های Emerald/Rose/
 * Amber به‌صورت مستقیم، بدون Design Token مخصوص Dashboard) هماهنگ
 * باشد. فقط متن فارسی (`orderStatusLabels`) از همان فایل Import شده
 * تا برچسب‌ها در کل پروژه یک‌جا تعریف بمانند، بدون Duplicate رشته‌ها.
 */
const STOREFRONT_STATUS_STYLES: Record<OrderStatus, string> = {
  pending: "bg-amber-50 text-amber-600",
  confirmed: "bg-blue-50 text-blue-600",
  processing: "bg-blue-50 text-blue-600",
  ready_to_ship: "bg-blue-50 text-blue-600",
  shipped: "bg-gray-100 text-gray-600",
  delivered: "bg-emerald-50 text-emerald-600",
  cancelled: "bg-rose-50 text-rose-600",
  returned: "bg-rose-50 text-rose-600",
};

export function StorefrontOrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${STOREFRONT_STATUS_STYLES[status]}`}
    >
      {orderStatusLabels[status] ?? "نامشخص"}
    </span>
  );
}
