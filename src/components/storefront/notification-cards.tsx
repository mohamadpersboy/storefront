import { Package, Ticket } from "lucide-react";
import { formatTomanGlyph, toPersianDigits } from "@/lib/utils/format";
import { formatJalali } from "@/lib/utils/jalali";
import { formatRemainingTime } from "@/lib/notifications/remaining-time";
import type { NotificationAudience, NotificationMeta } from "@/lib/notifications/constants";
import { StorefrontOrderStatusBadge } from "@/components/storefront/order-status-badge";

type OrderMeta = Extract<NotificationMeta, { kind: "order" }>;
type CouponMeta = Extract<NotificationMeta, { kind: "coupon" }>;

/** کارت خلاصهٔ سفارش و وضعیت (Snapshot لحظهٔ رویداد، نه وضعیت زندهٔ سفارش). */
export function OrderSummaryCard({ meta }: { meta: OrderMeta }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-3 ring-1 ring-black/5">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
        <Package className="size-5" strokeWidth={1.75} aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] text-[var(--sf-ink)]/50">شماره سفارش</p>
        <p className="text-sm font-bold text-[var(--sf-ink)]">
          #{toPersianDigits(meta.orderNumber)}
        </p>
      </div>
      {meta.status || meta.payment ? (
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className="text-[10px] text-[var(--sf-ink)]/50">
            {meta.status ? "وضعیت سفارش" : "وضعیت پرداخت"}
          </span>
          {meta.status ? (
            <StorefrontOrderStatusBadge status={meta.status} />
          ) : (
            <span
              className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                meta.payment === "success"
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-rose-50 text-rose-600"
              }`}
            >
              {meta.payment === "success" ? "پرداخت موفق" : "پرداخت ناموفق"}
            </span>
          )}
        </div>
      ) : null}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-xs">
      <span className="text-[var(--sf-ink)]/50">{label}</span>
      <span className="font-medium text-[var(--sf-ink)]">{value}</span>
    </div>
  );
}

/** کارت جزئیات کد تخفیف: کد، عمومی/اختصاصی، درصد، سقف، حداقل سفارش و اعتبار. */
export function CouponDetailsCard({
  meta,
  audience,
  now,
}: {
  meta: CouponMeta;
  audience: NotificationAudience;
  /** برای محاسبهٔ زمان باقی‌مانده؛ Prop است تا رندر قابل پیش‌بینی بماند. */
  now: number;
}) {
  const msLeft = new Date(meta.expiresAt).getTime() - now;
  const expired = msLeft <= 0;
  const isPrivate = audience === "user";

  return (
    <div className="rounded-xl bg-gradient-to-br from-[var(--sf-accent-soft)]/70 to-white p-3 ring-1 ring-black/5">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs font-bold text-[var(--sf-ink)]">
          <Ticket className="size-4 text-[var(--sf-accent)]" strokeWidth={2} aria-hidden="true" />
          کد تخفیف
        </span>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
            isPrivate ? "bg-violet-100 text-violet-600" : "bg-emerald-100 text-emerald-600"
          }`}
        >
          {isPrivate ? "اختصاصی" : "عمومی"}
        </span>
      </div>

      <p
        dir="ltr"
        className="mt-2 rounded-lg border border-dashed border-[var(--sf-accent)]/50 bg-white px-3 py-2 text-center text-lg font-bold tracking-[0.18em] text-[var(--sf-ink)]"
      >
        {meta.code}
      </p>

      <div className="mt-3 space-y-1.5">
        <Row label="میزان تخفیف" value={`${toPersianDigits(meta.discountPercentage)}٪`} />
        {meta.maxDiscountAmount ? (
          <Row label="سقف تخفیف" value={formatTomanGlyph(meta.maxDiscountAmount)} />
        ) : null}
        {meta.minOrderAmount > 0 ? (
          <Row label="حداقل مبلغ سفارش" value={formatTomanGlyph(meta.minOrderAmount)} />
        ) : null}
        <Row label="اعتبار تا" value={formatJalali(meta.expiresAt)} />
        <Row
          label="زمان باقی‌مانده"
          value={expired ? "منقضی شده" : formatRemainingTime(msLeft)}
        />
      </div>
    </div>
  );
}
