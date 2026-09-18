import Link from "next/link";
import { Gift, ChevronLeft } from "lucide-react";

/**
 * بنر «دعوت دوستان» بالای صفحه «حساب من» — طبق رفرنس بصری دقیق
 * کارفرما (اسکرین‌شات یک اپ دیگر): یک بنر گرادیانی تمام‌عرض درست
 * زیر کارت پروفایل، نه یک ردیف ساده داخل لیست «خرید و سفارش‌ها».
 * فقط رنگ عوض شده (گرادیان بنفش رفرنس → `--sf-accent`/`--sf-ink-soft`
 * خودمان)؛ چیدمان (آیکون هدیه سمت راست، متن وسط، فلش سمت چپ) دقیقاً
 * همان رفرنس است.
 *
 * فقط از `/account` صدا زده می‌شود و فقط وقتی
 * `ReferralSettings.enabled` باشد رندر می‌شود (چک در خود صفحه).
 */
export function ReferralAccountBanner() {
  return (
    <Link
      href="/account/referral"
      className="flex items-center gap-3 overflow-hidden rounded-[var(--radius-lg)] bg-gradient-to-l from-[var(--sf-accent)] to-[var(--sf-ink-soft)] p-4 text-white active:opacity-90"
    >
      <span className="flex size-12 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-white/15">
        <Gift className="size-6" strokeWidth={1.75} aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold">دوستاتو دعوت کن، هدیه بگیر!</p>
        <p className="mt-0.5 truncate text-xs text-white/80">
          به‌ازای هر دعوت موفق، یک کد تخفیف هدیه بگیرید
        </p>
      </div>
      <ChevronLeft className="size-4 shrink-0 text-white/70" aria-hidden="true" />
    </Link>
  );
}
