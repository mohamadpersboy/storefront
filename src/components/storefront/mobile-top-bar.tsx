import { Wallet, Headphones, Search } from "lucide-react";
import Link from "next/link";

/**
 * Top Bar موبایل Storefront.
 *
 * فقط زیر breakpoint `sm` نمایش داده می‌شود — در Tablet/Desktop
 * به‌جای آن Desktop Header استفاده خواهد شد (Phase جداگانه).
 *
 * تاریخچه اصلاحات کارفرما (به‌ترتیب):
 * ۱) پس‌زمینه رنگی ~۳۰٪ ارتفاع صفحه، منحنی «شکم‌مانند» در لبه پایین
 *    (نه گوشه گرد) — با یک `<svg>` (مسیر Bezier) پیاده‌سازی شد.
 * ۲) عمق شکم کمی بیشتر و محسوس‌تر شد (نه خیلی زیاد).
 * ۳) باکس جستجو از پایین (Overlap روی شکم) به بالاتر منتقل شد —
 *    مستقیماً زیر ردیف نام/آیکون‌ها، داخل ناحیه رنگی.
 * ۴) باکس جستجو کاملاً Pill-shaped شد (`rounded-full`).
 *
 * نکته مهم درباره «جستجوی لایو»: این باکس فعلاً یک Form استاندارد
 * (GET به `/search`) است — بدون JS اضافی در Client (طبق اصل
 * Performance پروژه). برای رفتار واقعاً Live (پیشنهاد لحظه‌ای هنگام
 * تایپ) به یک API جستجوی محصول (که هنوز در Backend وجود ندارد) و
 * یک Client Component با Debounce نیاز است — این خارج از Scope همین
 * ماژول UI است و نیاز به تأیید جداگانه برای افزودن API جدید دارد.
 */
export function MobileTopBar() {
  return (
    <div className="sm:hidden">
      <div className="relative bg-[var(--color-primary)] pt-[env(safe-area-inset-top)]">
        <div className="flex h-14 items-center justify-between px-4">
          <Link
            href="/wallet"
            aria-label="کیف پول"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm active:bg-white/25"
          >
            <Wallet className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
          </Link>

          <h1 className="text-base font-semibold text-white">فرش سقطچی</h1>

          <Link
            href="/support"
            aria-label="پشتیبانی"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm active:bg-white/25"
          >
            <Headphones className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
          </Link>
        </div>

        {/* باکس جستجو — مستقیماً زیر ردیف نام/آیکون‌ها، Pill-shaped */}
        <form action="/search" method="GET" className="px-4 pb-3">
          <div className="flex items-center gap-2 rounded-full bg-white px-4 py-3 shadow-[0_6px_16px_rgba(3,23,37,0.15)]">
            <Search className="h-5 w-5 text-gray-400" strokeWidth={1.75} aria-hidden="true" />
            <input
              type="search"
              name="q"
              placeholder="جستجوی فرش، رنگ، طرح..."
              className="min-w-0 flex-1 bg-transparent text-sm text-[var(--sf-ink)] placeholder:text-gray-400 focus:outline-none"
            />
          </div>
        </form>

        {/* فضای خالی باقی‌مانده تا مجموع ارتفاع (ردیف آیکون + باکس
            جستجو + این فاصله + شکم پایین) به حدود ۳۰٪ ارتفاع صفحه
            برسد. */}
        <div className="h-[9vh] min-h-[52px]" />

        {/* «شکم» پایین: خط بالا صاف (چسبیده به بدنه رنگی)، منحنی وسط
            به پایین کشیده می‌شود. عمق نسبت به نسخه قبلی کمی بیشتر و
            محسوس‌تر شده (نه خیلی زیاد). */}
        <svg
          className="block w-full text-[var(--color-primary)]"
          style={{ height: 60 }}
          viewBox="0 0 400 80"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path d="M0,0 L400,0 Q200,80 0,0 Z" fill="currentColor" />
        </svg>
      </div>
    </div>
  );
}
