import { Wallet, Headphones, Search } from "lucide-react";
import Link from "next/link";

/**
 * Top Bar موبایل Storefront (اصلاح‌شده طبق بازخورد کارفرما).
 *
 * فقط زیر breakpoint `sm` نمایش داده می‌شود — در Tablet/Desktop
 * به‌جای آن Desktop Header استفاده خواهد شد (Phase جداگانه).
 *
 * نکات مهم بازخورد:
 * - این‌بار به‌جای «گوشه‌های منحنی» (border-radius روی گوشه‌ها)، خودِ
 *   لبه پایین پس‌زمینه یک «شکم» به سمت پایین دارد — یک SVG با یک
 *   منحنی Bezier که در وسط عریض‌تر پایین می‌آید و در دو طرف به صفر
 *   می‌رسد (دقیقاً مثل شکم، نه یک مستطیل با گوشه گرد).
 * - ارتفاع کل پس‌زمینه رنگی (ردیف آیکون‌ها + فضای خالی + شکم پایین)
 *   حدود ۳۰٪ ارتفاع صفحه است.
 * - آیکون سمت چپ (end) از Bell به Headphones (پشتیبانی) تغییر کرد.
 * - آیکون سمت راست (start) از Search به Wallet تغییر کرد — چون
 *   Wallet یک قابلیت واقعی و از قبل ساخته‌شده در Backend است (نه یک
 *   Placeholder دلبخواهی). اگر آیکون دیگری مدنظرته بگو عوضش کنم.
 * - جستجو حالا یک باکس مستقل زیر ردیف آیکون‌هاست که روی شکم پایین
 *   Overlap می‌کند.
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

        {/* فضای خالی داخل پس‌زمینه رنگی تا مجموع ارتفاع (ردیف آیکون +
            این فاصله + شکم پایین) به حدود ۳۰٪ ارتفاع صفحه برسد. */}
        <div className="h-[18vh] min-h-[110px]" />

        {/* «شکم» پایین: خط بالا صاف (چسبیده به بدنه رنگی)، منحنی وسط
            به پایین می‌آید و در دو طرف به صفر می‌رسد. */}
        <svg
          className="block w-full text-[var(--color-primary)]"
          style={{ height: 44 }}
          viewBox="0 0 400 80"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path d="M0,0 L400,0 Q200,80 0,0 Z" fill="currentColor" />
        </svg>
      </div>

      {/* باکس جستجو — روی شکم پایین Overlap می‌کند */}
      <form action="/search" method="GET" className="relative z-10 -mt-8 px-4">
        <div className="flex items-center gap-2 rounded-2xl bg-white px-4 py-3 shadow-[0_8px_24px_rgba(3,23,37,0.12)]">
          <Search className="h-5 w-5 text-gray-400" strokeWidth={1.75} aria-hidden="true" />
          <input
            type="search"
            name="q"
            placeholder="جستجوی فرش، رنگ، طرح..."
            className="min-w-0 flex-1 bg-transparent text-sm text-[var(--sf-ink)] placeholder:text-gray-400 focus:outline-none"
          />
        </div>
      </form>
    </div>
  );
}
