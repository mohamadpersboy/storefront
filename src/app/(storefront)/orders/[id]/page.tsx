import { redirect, notFound } from "next/navigation";
import { Calendar, CreditCard, MapPin } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/current-user";
import { connectToDatabase } from "@/lib/db/connect";
import { getOrderDetailForCustomer, formatOrderDiscountLabel } from "@/lib/storefront/get-order-detail";
import { formatTomanGlyph, toPersianDigits } from "@/lib/utils/format";
import { formatJalali } from "@/lib/utils/jalali";
import { PageHeader } from "@/components/storefront/page-header";
import { OrderStatusBanner } from "@/components/storefront/order-status-banner";
import { StorefrontOrderStatusBadge } from "@/components/storefront/order-status-badge";
import type { PaymentMethod } from "@/models/Order";

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  online: "پرداخت آنلاین",
  cash: "پرداخت در محل",
  split: "پرداخت ترکیبی (کیف پول + آنلاین)",
};

type OrderDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const user = await getCurrentUser();
  const { id } = await params;
  if (!user) {
    redirect(`/login?redirect=/orders/${id}`);
  }

  await connectToDatabase();
  const order = await getOrderDetailForCustomer(id, String(user._id));
  if (!order) {
    notFound();
  }

  // آخرین ردیف statusHistory با وضعیت فعلی سفارش یکی است (همیشه با
  // یک تغییر وضعیت اضافه می‌شود)؛ یادداشت همان ردیف در بنر بالای
  // صفحه نشان داده می‌شود.
  const latestNote = order.statusHistory.at(-1)?.note ?? "";

  return (
    <div>
      <PageHeader title={`سفارش #${toPersianDigits(order.orderNumber)}`} />

      <div className="space-y-4 px-4 py-4 sm:px-6">
        <OrderStatusBanner status={order.status} note={latestNote} />

        <div className="rounded-[var(--radius-lg)] border border-black/5 bg-white p-4">
          <p className="mb-3 text-xs font-bold text-[var(--sf-ink)]">اطلاعات سفارش</p>
          <div className="space-y-3 text-xs">
            <div className="flex items-start gap-2 text-[var(--sf-ink)]/70">
              <Calendar className="mt-0.5 size-4 shrink-0 text-[var(--sf-ink)]/40" strokeWidth={1.75} aria-hidden="true" />
              <span>تاریخ ثبت: {formatJalali(order.createdAt)}</span>
            </div>
            <div className="flex items-start gap-2 text-[var(--sf-ink)]/70">
              <CreditCard className="mt-0.5 size-4 shrink-0 text-[var(--sf-ink)]/40" strokeWidth={1.75} aria-hidden="true" />
              <span>روش پرداخت: {PAYMENT_METHOD_LABELS[order.paymentMethod]}</span>
            </div>
            <div className="flex items-start gap-2 text-[var(--sf-ink)]/70">
              <MapPin className="mt-0.5 size-4 shrink-0 text-[var(--sf-ink)]/40" strokeWidth={1.75} aria-hidden="true" />
              <span className="leading-5">
                {order.shippingAddress.recipientName} — {order.shippingAddress.phoneNumber}
                <br />
                {order.shippingAddress.province}، {order.shippingAddress.city}،{" "}
                {order.shippingAddress.addressLine}
                <br />
                کد پستی: {toPersianDigits(order.shippingAddress.postalCode)}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-[var(--radius-lg)] border border-black/5 bg-white p-4">
          <p className="mb-3 text-xs font-bold text-[var(--sf-ink)]">
            کالاها ({toPersianDigits(order.items.length)})
          </p>

          <div className="divide-y divide-black/5">
            {order.items.map((item, index) => {
              const details = [item.unit, item.colorName, ...item.attributes.map((a) => `${a.name}: ${a.value}`)]
                .filter(Boolean)
                .join("، ");

              return (
                <div key={index} className="flex items-center justify-between gap-2 py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-[var(--sf-ink)]">{item.title}</p>
                    {details ? (
                      <p className="mt-0.5 text-[11px] text-[var(--sf-ink)]/45">{details}</p>
                    ) : null}
                    <p className="mt-0.5 text-[11px] text-[var(--sf-ink)]/45">
                      {toPersianDigits(item.quantity)} × {formatTomanGlyph(item.unitPrice)}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs font-bold text-[var(--sf-ink)]">
                    {formatTomanGlyph(item.lineTotal)}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-3 space-y-1.5 border-t border-dashed border-black/10 pt-3 text-xs">
            <div className="flex items-center justify-between text-[var(--sf-ink)]/60">
              <span>جمع اقلام</span>
              <span>{formatTomanGlyph(order.subtotal)}</span>
            </div>
            {order.discount ? (
              <div className="flex items-center justify-between text-[var(--color-success)]">
                <span>
                  {formatOrderDiscountLabel(order.discount)} ({toPersianDigits(order.discount.discountPercentage)}٪)
                </span>
                <span>−{formatTomanGlyph(order.discount.amount)}</span>
              </div>
            ) : null}
            <div className="flex items-center justify-between text-[var(--sf-ink)]/60">
              <span>هزینه ارسال</span>
              <span className={order.shippingCost === 0 ? "font-bold text-[var(--color-success)]" : undefined}>
                {order.shippingCost === 0 ? "رایگان" : formatTomanGlyph(order.shippingCost)}
              </span>
            </div>
            <div className="flex items-center justify-between border-t border-dashed border-black/10 pt-1.5 text-sm font-bold text-[var(--sf-ink)]">
              <span>مبلغ کل</span>
              <span>{formatTomanGlyph(order.totalAmount)}</span>
            </div>

            {order.paymentMethod === "split" ? (
              <>
                <div className="flex items-center justify-between pt-1 text-[var(--sf-ink)]/60">
                  <span>پرداخت‌شده از درگاه</span>
                  <span>{formatTomanGlyph(order.prepaymentAmount)}</span>
                </div>
                <div className="flex items-center justify-between text-[var(--sf-ink)]/60">
                  <span>پرداخت‌شده از کیف پول</span>
                  <span>{formatTomanGlyph(order.remainingAmount)}</span>
                </div>
              </>
            ) : null}
          </div>
        </div>

        <div className="rounded-[var(--radius-lg)] border border-black/5 bg-white p-4">
          <p className="mb-3 text-xs font-bold text-[var(--sf-ink)]">پیگیری سفارش</p>
          <ul className="space-y-4">
            {order.statusHistory.map((entry, index) => (
              <li key={index} className="flex items-start justify-between gap-2">
                <div>
                  <StorefrontOrderStatusBadge status={entry.status} />
                  {entry.note ? (
                    <p className="mt-1.5 text-[11px] leading-5 text-[var(--sf-ink)]/50">{entry.note}</p>
                  ) : null}
                </div>
                <span className="shrink-0 text-[11px] text-[var(--sf-ink)]/40">
                  {formatJalali(entry.changedAt)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
