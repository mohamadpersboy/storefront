"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Combobox } from "@/components/ui/combobox";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { OrderStatusBadge, orderStatusLabels } from "@/components/orders/order-status-badge";
import { formatToman, toPersianDigits } from "@/lib/utils/format";
import {
  getAllowedNextStatuses,
  type OrderStatus,
} from "@/lib/constants/order-status";

export interface OrderDetailData {
  id: string;
  orderNumber: number;
  customer: { fullName?: string; phoneNumber: string } | null;
  items: Array<{
    title: string;
    unit: string;
    colorName: string | null;
    attributes: Array<{ name: string; value: string }>;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
  }>;
  shippingAddress: {
    recipientName: string;
    phoneNumber: string;
    province: string;
    city: string;
    addressLine: string;
    postalCode: string;
  };
  subtotal: number;
  shippingCost: number;
  totalAmount: number;
  paymentMethod: "online" | "cash" | "split";
  prepaymentPercent: number;
  prepaymentAmount: number;
  remainingAmount: number;
  status: OrderStatus;
  notes: string;
  createdAt: string;
}

const paymentMethodLabels: Record<string, string> = {
  online: "پرداخت کامل آنلاین",
  cash: "پرداخت کامل در محل",
  split: "پرداخت ترکیبی",
};

export function OrderDetailCard({ order }: { order: OrderDetailData }) {
  const router = useRouter();
  const allowedNext = getAllowedNextStatuses(order.status);

  const [pendingStatus, setPendingStatus] = useState<OrderStatus | null>(null);
  const [changing, setChanging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirmStatusChange() {
    if (!pendingStatus) return;
    setChanging(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/orders/${order.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: pendingStatus }),
      });
      const body = await res.json();
      if (!res.ok || !body.success) {
        setError(body.message ?? "خطا در تغییر وضعیت");
        return;
      }
      setPendingStatus(null);
      router.refresh();
    } catch {
      setError("ارتباط با سرور برقرار نشد");
    } finally {
      setChanging(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {error ? (
        <div className="rounded-[var(--radius-md)] border border-red-200 bg-red-50 px-4 py-2.5 text-xs text-danger">
          {error}
        </div>
      ) : null}

      <Card>
        <CardHeader
          title={`سفارش #${toPersianDigits(order.orderNumber)}`}
          description={order.customer?.fullName ?? order.customer?.phoneNumber ?? "—"}
          action={<OrderStatusBadge status={order.status} />}
        />
        <CardContent className="flex flex-col gap-4">
          {allowedNext.length > 0 ? (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <div className="flex-1">
                <label className="mb-1.5 block text-xs font-medium text-foreground/80">
                  تغییر وضعیت به
                </label>
                <Combobox
                  value={pendingStatus ?? ""}
                  onChange={(v) => setPendingStatus(v as OrderStatus)}
                  placeholder="انتخاب وضعیت جدید"
                  options={allowedNext.map((s) => ({
                    value: s,
                    label: orderStatusLabels[s],
                  }))}
                />
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted">
              این سفارش در وضعیت نهایی است و دیگر قابل تغییر نیست.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="اقلام سفارش" />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-border text-right text-xs text-muted">
                <th className="px-5 py-3 font-medium">محصول</th>
                <th className="px-5 py-3 font-medium">مشخصات</th>
                <th className="px-5 py-3 font-medium">تعداد</th>
                <th className="px-5 py-3 font-medium">قیمت واحد</th>
                <th className="px-5 py-3 font-medium">جمع</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, i) => (
                <tr key={i} className="border-b border-border last:border-0">
                  <td className="px-5 py-3 font-medium text-foreground">{item.title}</td>
                  <td className="px-5 py-3 text-xs text-muted">
                    {[item.unit, item.colorName, ...item.attributes.map((a) => a.value)]
                      .filter(Boolean)
                      .join(" · ")}
                  </td>
                  <td className="px-5 py-3 tabular-nums">{toPersianDigits(item.quantity)}</td>
                  <td className="px-5 py-3 tabular-nums">{formatToman(item.unitPrice)}</td>
                  <td className="px-5 py-3 tabular-nums font-medium">
                    {formatToman(item.lineTotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="آدرس ارسال" />
          <CardContent className="flex flex-col gap-1.5 text-sm text-foreground/80">
            <p>{order.shippingAddress.recipientName}</p>
            <p dir="ltr" className="text-left">{order.shippingAddress.phoneNumber}</p>
            <p>
              {order.shippingAddress.province}، {order.shippingAddress.city}
            </p>
            <p>{order.shippingAddress.addressLine}</p>
            <p className="text-xs text-muted">
              کد پستی: {toPersianDigits(order.shippingAddress.postalCode)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="پرداخت" />
          <CardContent className="flex flex-col gap-1.5 text-sm">
            <div className="flex justify-between text-foreground/80">
              <span>روش پرداخت</span>
              <span>{paymentMethodLabels[order.paymentMethod]}</span>
            </div>
            <div className="flex justify-between text-foreground/80">
              <span>جمع اقلام</span>
              <span className="tabular-nums">{formatToman(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-foreground/80">
              <span>هزینه ارسال</span>
              <span className="tabular-nums">{formatToman(order.shippingCost)}</span>
            </div>
            <div className="flex justify-between font-medium text-foreground">
              <span>مبلغ کل</span>
              <span className="tabular-nums">{formatToman(order.totalAmount)}</span>
            </div>
            <div className="mt-1.5 flex justify-between border-t border-border pt-1.5 text-primary">
              <span>پیش‌پرداخت آنلاین</span>
              <span className="tabular-nums">{formatToman(order.prepaymentAmount)}</span>
            </div>
            <div className="flex justify-between text-muted">
              <span>باقی‌مانده (در محل)</span>
              <span className="tabular-nums">{formatToman(order.remainingAmount)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {order.notes ? (
        <Card>
          <CardHeader title="یادداشت" />
          <CardContent className="text-sm text-foreground/80">{order.notes}</CardContent>
        </Card>
      ) : null}

      <ConfirmDialog
        open={pendingStatus !== null}
        title="تغییر وضعیت سفارش"
        description={
          pendingStatus
            ? `آیا از تغییر وضعیت سفارش به «${orderStatusLabels[pendingStatus]}» مطمئن هستید؟`
            : ""
        }
        confirmLabel="تأیید تغییر"
        loading={changing}
        onCancel={() => setPendingStatus(null)}
        onConfirm={confirmStatusChange}
      />
    </div>
  );
}
