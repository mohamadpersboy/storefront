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
import { OrderDetailItemRow } from "@/components/storefront/order-detail-item-row";
import type { PaymentMethod } from "@/models/Order";

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  online: "پرداخت آنلاین",
  cash: "پرداخت در محل",
  split: "پرداخت ترکیبی (کیف پول + آنلاین)",
};

/**
 * یک آمار کوچک در کارت «اطلاعات سفارش» (تاریخ/روش پرداخت) — آیکون
 * در دایره‌ای خاکستری + برچسب کم‌رنگ بالای مقدار پررنگ، به‌جای
 * نسخه قبلی که هر سه ردیف (تاریخ/پرداخت/آدرس) را با یک آیکون خط‌به‌خط
 * هم‌رنگ و هم‌وزن نشان می‌داد (به نظر کارفرما یک‌رنگ و نامرتب بود).
 * فقط داخل همین صفحه استفاده می‌شود، به همین دلیل Component جدا
 * نشد.
 */
function InfoStat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Calendar;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500">
        <Icon className="size-4" strokeWidth={1.75} aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] text-[var(--sf-ink)]/40">{label}</p>
        <p className="truncate text-xs font-bold text-[var(--sf-ink)]">{value}</p>
      </div>
    </div>
  );
}

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

      <div className="space-y-5 px-4 py-4 sm:px-6">
        <OrderStatusBanner status={order.status} note={latestNote} />

        <div className="rounded-[var(--radius-lg)] border border-black/5 bg-white p-5">
          <p className="mb-4 text-sm font-bold text-[var(--sf-ink)]">اطلاعات سفارش</p>

          <div className="grid grid-cols-2 gap-3">
            <InfoStat icon={Calendar} label="تاریخ ثبت" value={formatJalali(order.createdAt)} />
            <InfoStat
              icon={CreditCard}
              label="روش پرداخت"
              value={PAYMENT_METHOD_LABELS[order.paymentMethod]}
            />
          </div>

          <div className="mt-4 rounded-[var(--radius-md)] bg-gray-50 p-3.5">
            <div className="mb-2 flex items-center gap-1.5 text-[var(--color-primary)]">
              <MapPin className="size-4" strokeWidth={1.75} aria-hidden="true" />
              <span className="text-xs font-bold">آدرس تحویل</span>
            </div>
            <p className="text-xs font-bold text-[var(--sf-ink)]">
              {order.shippingAddress.recipientName}
              <span className="font-normal text-[var(--sf-ink)]/45"> — {order.shippingAddress.phoneNumber}</span>
            </p>
            <p className="mt-1.5 text-xs leading-5 text-[var(--sf-ink)]/60">
              {order.shippingAddress.province}، {order.shippingAddress.city}، {order.shippingAddress.addressLine}
            </p>
            <p className="mt-1.5 text-[11px] text-[var(--sf-ink)]/40">
              کد پستی: {toPersianDigits(order.shippingAddress.postalCode)}
            </p>
          </div>
        </div>

        <div className="rounded-[var(--radius-lg)] border border-black/5 bg-white p-5">
          <p className="mb-1 text-sm font-bold text-[var(--sf-ink)]">
            کالاها ({toPersianDigits(order.items.length)})
          </p>

          <div className="divide-y divide-black/5">
            {order.items.map((item, index) => (
              <OrderDetailItemRow key={index} item={item} />
            ))}
          </div>

          <div className="mt-1 space-y-2 border-t border-dashed border-black/10 pt-4 text-xs">
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

        <div className="rounded-[var(--radius-lg)] border border-black/5 bg-white p-5">
          <p className="mb-4 text-sm font-bold text-[var(--sf-ink)]">پیگیری سفارش</p>
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
