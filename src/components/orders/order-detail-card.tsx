"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Clock } from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Combobox } from "@/components/ui/combobox";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { OrderStatusBadge, orderStatusLabels } from "@/components/orders/order-status-badge";
import { PaymentPanel, type PaymentPanelData } from "@/components/orders/payment-panel";
import { ManualPaymentsPanel } from "@/components/orders/manual-payments-panel";
import { formatToman, toPersianDigits } from "@/lib/utils/format";
import {
  Table,
  TableHeaderRow,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  getAllowedNextStatuses,
  type OrderStatus,
} from "@/lib/constants/order-status";

export interface OrderStatusHistoryItem {
  status: OrderStatus;
  changedAt: string;
  changedByName: string;
  note?: string;
}

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
    latitude?: number;
    longitude?: number;
  };
  subtotal: number;
  shippingCost: number;
  discount: {
    source: "coupon" | "payment_reward";
    amount: number;
    discountPercentage: number;
    couponCode: string | null;
    rewardType: "online" | "mixed" | null;
  } | null;
  totalAmount: number;
  paymentMethod: "online" | "cash" | "split";
  prepaymentPercent: number;
  prepaymentAmount: number;
  remainingAmount: number;
  paidAmount: number;
  status: OrderStatus;
  statusHistory: OrderStatusHistoryItem[];
  notes: string;
  createdAt: string;
  payments: PaymentPanelData[];
}

const paymentMethodLabels: Record<string, string> = {
  online: "پرداخت کامل آنلاین",
  cash: "پرداخت کامل در محل",
  split: "پرداخت ترکیبی",
};

function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("fa-IR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(iso));
}

export function OrderDetailCard({ order }: { order: OrderDetailData }) {
  const router = useRouter();
  const allowedNext = getAllowedNextStatuses(order.status);

  const [pendingStatus, setPendingStatus] = useState<OrderStatus | null>(null);
  const [statusNote, setStatusNote] = useState("");
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
        body: JSON.stringify({
          status: pendingStatus,
          note: statusNote.trim() || undefined,
        }),
      });
      const body = await res.json();
      if (!res.ok || !body.success) {
        setError(body.message ?? "خطا در تغییر وضعیت");
        return;
      }
      setPendingStatus(null);
      setStatusNote("");
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
        <Table>
          <TableHeaderRow>
            <TableHead>محصول</TableHead>
            <TableHead>مشخصات</TableHead>
            <TableHead>تعداد</TableHead>
            <TableHead>قیمت واحد</TableHead>
            <TableHead>جمع</TableHead>
          </TableHeaderRow>
          <TableBody>
            {order.items.map((item, i) => (
              <TableRow key={i}>
                <TableCell mobileVariant="title" className="font-medium text-foreground">
                  {item.title}
                </TableCell>
                <TableCell label="مشخصات" className="text-xs text-muted">
                  {[item.unit, item.colorName, ...(item.attributes ?? []).map((a) => a.value)]
                    .filter(Boolean)
                    .join(" · ")}
                </TableCell>
                <TableCell label="تعداد" className="tabular-nums">{toPersianDigits(item.quantity)}</TableCell>
                <TableCell label="قیمت واحد" className="tabular-nums">{formatToman(item.unitPrice)}</TableCell>
                <TableCell label="جمع" className="tabular-nums font-medium">
                  {formatToman(item.lineTotal)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="آدرس ارسال" />
          <CardContent className="flex flex-col gap-2 text-sm">
            <p>
              <span className="text-muted">تحویل‌گیرنده: </span>
              <span className="font-medium text-foreground">
                {order.shippingAddress.recipientName}
              </span>
            </p>
            <p className="tabular-nums">
              <span className="text-muted">شماره تماس: </span>
              <span className="font-medium text-foreground">
                {order.shippingAddress.phoneNumber}
              </span>
            </p>
            <div className="flex gap-4">
              <p>
                <span className="text-muted">استان: </span>
                <span className="font-medium text-foreground">
                  {order.shippingAddress.province}
                </span>
              </p>
              <p>
                <span className="text-muted">شهر: </span>
                <span className="font-medium text-foreground">
                  {order.shippingAddress.city}
                </span>
              </p>
            </div>
            <p>
              <span className="text-muted">آدرس: </span>
              <span className="font-medium text-foreground">
                {order.shippingAddress.addressLine}
              </span>
            </p>
            <p className="tabular-nums">
              <span className="text-muted">کد پستی: </span>
              <span className="font-medium text-foreground">
                {toPersianDigits(order.shippingAddress.postalCode)}
              </span>
            </p>
            {order.shippingAddress.latitude !== undefined &&
            order.shippingAddress.longitude !== undefined ? (
              <a
                href={`https://neshan.org/maps?latitude=${order.shippingAddress.latitude}&longitude=${order.shippingAddress.longitude}&zoom=15`}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-primary underline"
              >
                نمایش موقعیت روی نقشه نشان
              </a>
            ) : null}
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
            {order.discount ? (
              <div className="flex justify-between text-green-700">
                <span>
                  {order.discount.source === "coupon"
                    ? `تخفیف کد ${order.discount.couponCode}`
                    : `پاداش پرداخت ${order.discount.rewardType === "online" ? "آنلاین" : "ترکیبی"}`}
                  {" "}({order.discount.discountPercentage}٪)
                </span>
                <span className="tabular-nums">−{formatToman(order.discount.amount)}</span>
              </div>
            ) : null}
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

      <PaymentPanel
        orderId={order.id}
        paymentMethod={order.paymentMethod}
        prepaymentAmount={order.prepaymentAmount}
        initialPayments={order.payments}
      />

      <ManualPaymentsPanel
        orderId={order.id}
        totalAmount={order.totalAmount}
        paidAmount={order.paidAmount}
        remainingAmount={order.remainingAmount}
      />

      <Card>
        <CardHeader title="تاریخچه وضعیت" description="پیامک اطلاع‌رسانی هم در هر تغییر برای مشتری ارسال می‌شود" />
        <CardContent className="p-0">
          <ul className="divide-y divide-border">
            {[...order.statusHistory].reverse().map((entry, i) => (
              <li key={i} className="flex flex-col gap-1 px-5 py-3">
                <div className="flex items-center justify-between">
                  <OrderStatusBadge status={entry.status} />
                  <span className="flex items-center gap-1 text-xs text-muted">
                    <Clock className="size-3.5" />
                    {formatDateTime(entry.changedAt)}
                  </span>
                </div>
                <p className="text-xs text-muted">توسط {entry.changedByName}</p>
                {entry.note ? (
                  <p className="mt-1 rounded-[var(--radius-sm)] bg-surface-subtle px-3 py-2 text-xs text-foreground/80">
                    {entry.note}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {order.notes ? (
        <Card>
          <CardHeader title="یادداشت سفارش" />
          <CardContent className="text-sm text-foreground/80">{order.notes}</CardContent>
        </Card>
      ) : null}

      <ConfirmDialog
        open={pendingStatus !== null}
        title="تغییر وضعیت سفارش"
        description={
          pendingStatus
            ? `آیا از تغییر وضعیت سفارش به «${orderStatusLabels[pendingStatus]}» مطمئن هستید؟ پیامک اطلاع‌رسانی برای مشتری ارسال می‌شود.`
            : ""
        }
        confirmLabel="تأیید تغییر"
        loading={changing}
        onCancel={() => {
          setPendingStatus(null);
          setStatusNote("");
        }}
        onConfirm={confirmStatusChange}
        extraContent={
          <div>
            <label className="mb-1.5 block text-xs font-medium text-foreground/80">
              یادداشت (اختیاری)
            </label>
            <Textarea
              rows={2}
              value={statusNote}
              onChange={(e) => setStatusNote(e.target.value)}
              placeholder="مثلاً دلیل لغو، شماره پیگیری پست و..."
            />
          </div>
        }
      />
    </div>
  );
}
