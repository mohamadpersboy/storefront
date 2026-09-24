import Link from "next/link";
import { Ticket } from "lucide-react";
import { formatTomanGlyph, toPersianDigits } from "@/lib/utils/format";
import { formatJalali } from "@/lib/utils/jalali";
import type { CouponHistoryEntry } from "@/lib/storefront/get-user-coupon-history";

/**
 * یک ردیف تاریخچه کد تخفیف — هم‌خانواده با `WalletTransactionRow`
 * (آیکون در جعبه رنگی + عنوان/جزئیات + مبلغ/تاریخ)، همان رنگ
 * کهربایی که در `AccountNavRow` برای همین لینک استفاده شده
 * (`bg-amber-50 text-amber-600`). کل ردیف یک `Link` به سفارشی است
 * که این کد رویش اعمال شده — طبیعی‌ترین اقدام بعدی «دیدن آن سفارش»
 * است.
 */
export function CouponHistoryRow({ entry }: { entry: CouponHistoryEntry }) {
  return (
    <Link href={`/orders/${entry.orderId}`} className="flex items-center gap-3 px-4 py-3.5 active:bg-gray-50">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-amber-50 text-amber-600">
        <Ticket className="size-5" strokeWidth={1.75} aria-hidden="true" />
      </span>

      <div className="min-w-0 flex-1">
        <p dir="ltr" className="text-right text-sm font-bold tracking-wide text-[var(--sf-ink)]">
          {entry.code}
        </p>
        <p className="mt-0.5 truncate text-xs text-[var(--sf-ink)]/50">
          ٪{toPersianDigits(entry.discountPercentage)} تخفیف · سفارش #{toPersianDigits(entry.orderNumber)}
        </p>
      </div>

      <div className="shrink-0 text-left">
        <p className="text-sm font-bold text-emerald-600">−{formatTomanGlyph(entry.discountAmount)}</p>
        <p className="mt-0.5 text-[10px] text-[var(--sf-ink)]/40">{formatJalali(entry.usedAt)}</p>
      </div>
    </Link>
  );
}
