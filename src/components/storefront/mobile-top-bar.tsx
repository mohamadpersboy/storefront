import Link from "next/link";
import { Search, Headphones } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { NotificationBell } from "@/components/storefront/notification-bell";

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
 *
 * `sticky top-0 z-40`: طبق درخواست صریح «هر دو بار رو فیکس کن»،
 * Top Bar هم مثل Bottom Bar حین اسکرول ثابت می‌ماند. عمداً از
 * `sticky` به‌جای `fixed` استفاده شد — از نظر بصری دقیقاً همان
 * «چسبیده به بالا حین اسکرول» را می‌دهد، اما چون فضای خودش را در
 * Flow صفحه حفظ می‌کند نیازی به محاسبه دستی Padding جبرانی روی
 * محتوای زیرش ندارد (برخلاف Bottom Bar که چون `fixed` است باید
 * `pb-[76px]` در Layout جبران شود).
 *
 * آیکون Notification از یک Link ساده به کامپوننت مستقل
 * `NotificationBell` (پاپ‌آپ کامل با بستن با کلیک بیرون/Escape)
 * تغییر کرد — نگاه کنید `notification-bell.tsx`.
 */
export function MobileTopBar() {
  return (
    <div
      className={cn(
        "sm:hidden",
        "sticky top-0 z-40",
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

          <NotificationBell />

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
