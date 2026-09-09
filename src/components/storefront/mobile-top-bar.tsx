import Link from "next/link";
import { Search, Bell, Headphones } from "lucide-react";

/**
 * Top Bar موبایل Storefront.
 *
 * تلاش‌های قبلی (پس‌زمینه رنگی Indigo + شکم منحنی پایین) کاملاً رد
 * شدند و Revert شدند (نگاه کنید Git history: commit
 * `revert(storefront): remove rejected top bar design`). این نسخه
 * از صفر و دقیقاً بر اساس رفرنس جدید کارفرما طراحی شده — یک اپ مالی
 * با ردیف بالای ساده روی پس‌زمینه سفید: Avatar/Logo یک طرف + سه
 * دکمه دایره‌ای خاکستری‌روشن (Search، Notification، Support) طرف
 * دیگر.
 *
 * تفاوت‌های عمدی نسبت به رفرنس (طبق درخواست صریح کارفرما):
 * - RTL: چون کل سایت `dir="rtl"` است، همین ترتیب DOM (Logo اول،
 *   گروه آیکون‌ها دوم) با `justify-between` به‌طور طبیعی Logo را
 *   سمت راست و آیکون‌ها را سمت چپ می‌نشاند — دقیقاً برعکس رفرنس
 *   اصلی (که LTR بود و Avatar سمت چپ/Start بود).
 * - به‌جای عکس پروفایل کاربر، Badge برند («فس» = فرش سقطچی، دو حرف
 *   اول، هم‌الگو با روش Initials موجود در Dashboard) نمایش داده
 *   می‌شود — چون هنوز فایل Logo واقعی در پروژه آپلود نشده.
 * - نقطه قرمز روی آیکون Notification در رفرنس عمداً حذف شد: نشان‌
 *   دهنده اعلان خوانده‌نشده واقعی نیست و نمایشش بدون داده واقعی یک
 *   Badge ساختگی می‌بود.
 */
export function MobileTopBar() {
  return (
    <div className="bg-white px-4 pb-3 pt-[calc(env(safe-area-inset-top)+12px)] sm:hidden">
      <div className="flex items-center justify-between">
        <Link
          href="/"
          aria-label="فرش سقطچی"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--color-primary)] text-sm font-bold text-white"
        >
          فس
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href="/search"
            aria-label="جستجو"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-[var(--sf-ink)] active:bg-gray-200"
          >
            <Search className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
          </Link>

          <Link
            href="/notifications"
            aria-label="اعلان‌ها"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-[var(--sf-ink)] active:bg-gray-200"
          >
            <Bell className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
          </Link>

          <Link
            href="/support"
            aria-label="پشتیبانی"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-[var(--sf-ink)] active:bg-gray-200"
          >
            <Headphones className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </div>
  );
}
