import { mockRecentOrders } from "@/lib/mock/dashboard";
import { formatToman, toPersianDigits } from "@/lib/utils/format";
import { OrderStatusBadge } from "@/components/dashboard/order-status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ShoppingCart } from "lucide-react";

export function RecentOrdersTable({
  orders = mockRecentOrders,
}: {
  orders?: typeof mockRecentOrders;
}) {
  if (orders.length === 0) {
    return (
      <EmptyState
        icon={ShoppingCart}
        title="هنوز سفارشی ثبت نشده"
        description="سفارش‌های جدید همین‌جا نمایش داده می‌شوند."
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] text-sm">
        <thead>
          <tr className="border-b border-border text-right text-xs text-muted">
            <th className="px-5 py-3 font-medium">شماره سفارش</th>
            <th className="px-5 py-3 font-medium">مشتری</th>
            <th className="px-5 py-3 font-medium">اقلام</th>
            <th className="px-5 py-3 font-medium">مبلغ</th>
            <th className="px-5 py-3 font-medium">وضعیت</th>
            <th className="px-5 py-3 font-medium">تاریخ</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr
              key={order.id}
              className="border-b border-border last:border-0 hover:bg-surface-subtle"
            >
              <td className="px-5 py-3 font-medium text-foreground">
                #{toPersianDigits(order.id)}
              </td>
              <td className="px-5 py-3 text-foreground/80">
                {order.customerName}
              </td>
              <td className="px-5 py-3 tabular-nums text-foreground/80">
                {toPersianDigits(order.itemsCount)}
              </td>
              <td className="px-5 py-3 tabular-nums text-foreground/80">
                {formatToman(order.total)}
              </td>
              <td className="px-5 py-3">
                <OrderStatusBadge status={order.status} />
              </td>
              <td className="px-5 py-3 tabular-nums text-muted">
                {order.createdAt}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
