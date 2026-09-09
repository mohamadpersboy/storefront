import Link from "next/link";
import { Search, Bell, Headphones } from "lucide-react";
import { cn } from "@/lib/utils/cn";

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
 *
 * هماهنگ‌سازی با Bottom Bar (بازخورد کارفرما بعد از دیدن نسخه
 * Deploy‌شده):
 * - Backdrop حالا دقیقاً همان `bg-white/75 backdrop-blur-xl` +
 *   Border محو Bottom Bar را دارد (قبلاً `bg-white` توپر بود).
 * - رنگ آیکون‌ها به `text-gray-400` تغییر کرد تا با رنگ حالت
 *   غیرفعال آیکون‌های Bottom Bar یکسان باشد (قبلاً `--sf-ink` تیره
 *   بود). ضخامت (`strokeWidth={1.75}`) از قبل هم با حالت غیرفعال
 *   Bottom Bar یکی بود.
 * - نقطه Badge اعلان روی آیکون Bell اضافه شد، رنگ Indigo
 *   (`var(--color-primary)`, هم‌رنگ حالت فعال Bottom Bar). طبق
 *   بازخورد کارفرما رنگش مشخص شد، اما **نمایشش شرطی و پیش‌فرض
 *   خاموش است** (`hasUnreadNotifications = false`) — دقیقاً مثل
 *   الگوی تأییدشده بج سبد خرید در Bottom Bar: تا وقتی داده واقعی
 *   اعلان از Backend وصل نشده، صفر/عدم‌نمایش واقعی است، نه
 *   ساختگی. به‌محض اتصال به API واقعی اعلان‌ها، فقط این یک Boolean
 *   باید به مقدار واقعی وصل شود.
 */
export function MobileTopBar() {
  const hasUnreadNotifications = false;

  return (
    <div
      className={cn(
        "sm:hidden",
        "border-b border-black/5 bg-white/75 backdrop-blur-xl",
        "px-4 pb-3 pt-[calc(env(safe-area-inset-top)+12px)]",
      )}
    >
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
            className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-gray-400 active:bg-gray-200"
          >
            <Search className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
          </Link>

          <Link
            href="/notifications"
            aria-label="اعلان‌ها"
            className="relative flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-gray-400 active:bg-gray-200"
          >
            <Bell className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
            {hasUnreadNotifications && (
              <span className="absolute end-2.5 top-2.5 h-2 w-2 rounded-full bg-[var(--color-primary)] ring-2 ring-white" />
            )}
          </Link>

          <Link
            href="/support"
            aria-label="پشتیبانی"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-gray-400 active:bg-gray-200"
          >
            <Headphones className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </div>
  );
}
