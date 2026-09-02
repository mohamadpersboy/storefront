import { mockRecentOrders } from "@/lib/mock/dashboard";
import { formatToman, toPersianDigits } from "@/lib/utils/format";
import { OrderStatusBadge } from "@/components/dashboard/order-status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ShoppingCart } from "lucide-react";
import {
  Table,
  TableHeaderRow,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";

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
    <Table>
      <TableHeaderRow>
        <TableHead>شماره سفارش</TableHead>
        <TableHead>مشتری</TableHead>
        <TableHead>اقلام</TableHead>
        <TableHead>مبلغ</TableHead>
        <TableHead>وضعیت</TableHead>
        <TableHead>تاریخ</TableHead>
      </TableHeaderRow>
      <TableBody>
        {orders.map((order) => (
          <TableRow key={order.id}>
            <TableCell mobileVariant="title" className="font-medium text-foreground">
              #{toPersianDigits(order.id)}
            </TableCell>
            <TableCell label="مشتری" className="text-foreground/80">{order.customerName}</TableCell>
            <TableCell label="اقلام" className="tabular-nums text-foreground/80">
              {toPersianDigits(order.itemsCount)}
            </TableCell>
            <TableCell label="مبلغ" className="tabular-nums text-foreground/80">
              {formatToman(order.total)}
            </TableCell>
            <TableCell label="وضعیت">
              <OrderStatusBadge status={order.status} />
            </TableCell>
            <TableCell label="تاریخ" className="tabular-nums text-muted">{order.createdAt}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
