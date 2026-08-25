import Link from "next/link";
import { Phone, Calendar, Clock, ShoppingCart } from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHeaderRow,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { UserStatusBadge } from "@/components/users/user-status-badge";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { formatToman, toPersianDigits } from "@/lib/utils/format";
import type { OrderStatus } from "@/lib/constants/order-status";

export interface CustomerDetailData {
  id: string;
  fullName: string | null;
  phoneNumber: string;
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  ordersCount: number;
  totalSpent: number;
  partialTotalSpent: boolean;
  orders: Array<{
    id: string;
    orderNumber: number;
    status: OrderStatus;
    totalAmount: number;
    createdAt: string;
  }>;
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("fa-IR").format(new Date(iso));
}

export function CustomerDetailCard({ customer }: { customer: CustomerDetailData }) {
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader
          title={customer.fullName ?? "بدون نام"}
          description={customer.phoneNumber}
          action={<UserStatusBadge isActive={customer.isActive} />}
        />
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="flex items-center gap-2 text-sm text-foreground/80">
              <Phone className="size-4 text-muted" />
              <span className="tabular-nums">{customer.phoneNumber}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-foreground/80">
              <ShoppingCart className="size-4 text-muted" />
              {toPersianDigits(customer.ordersCount)} سفارش
            </div>
            <div className="flex items-center gap-2 text-sm text-foreground/80">
              <Calendar className="size-4 text-muted" />
              عضویت {formatDate(customer.createdAt)}
            </div>
            <div className="flex items-center gap-2 text-sm text-foreground/80">
              <Clock className="size-4 text-muted" />
              {customer.lastLoginAt
                ? `آخرین ورود ${formatDate(customer.lastLoginAt)}`
                : "هنوز وارد نشده"}
            </div>
          </div>
          <div className="rounded-[var(--radius-md)] border border-dashed border-border-strong p-3 text-sm">
            مجموع خرید{customer.partialTotalSpent ? " (سفارش‌های اخیر)" : ""}:{" "}
            <span className="font-medium text-primary">{formatToman(customer.totalSpent)}</span>
          </div>
          <Link
            href={`/dashboard/users/${customer.id}`}
            className="w-fit text-xs text-muted underline decoration-dotted hover:text-foreground"
          >
            تغییر نقش یا وضعیت این حساب از صفحه کاربران
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="سفارش‌های مشتری" />
        {customer.orders.length === 0 ? (
          <EmptyState
            icon={ShoppingCart}
            title="هنوز سفارشی ثبت نشده"
            description="سفارش‌های این مشتری اینجا نمایش داده می‌شوند."
          />
        ) : (
          <Table>
            <TableHeaderRow>
              <TableHead className="px-4 py-3">شماره سفارش</TableHead>
              <TableHead className="px-4 py-3">مبلغ</TableHead>
              <TableHead className="px-4 py-3">وضعیت</TableHead>
              <TableHead className="px-4 py-3">تاریخ</TableHead>
            </TableHeaderRow>
            <TableBody>
              {customer.orders.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="px-4 py-3">
                    <Link
                      href={`/dashboard/orders/${o.id}`}
                      className="font-medium text-foreground hover:text-primary"
                    >
                      #{toPersianDigits(o.orderNumber)}
                    </Link>
                  </TableCell>
                  <TableCell className="px-4 py-3 tabular-nums">
                    {formatToman(o.totalAmount)}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <OrderStatusBadge status={o.status} />
                  </TableCell>
                  <TableCell className="px-4 py-3 tabular-nums text-muted">
                    {formatDate(o.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
