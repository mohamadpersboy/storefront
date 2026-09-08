import Link from "next/link";
import { Search, Bell } from "lucide-react";

/**
 * Top Bar موبایل Storefront.
 *
 * فقط زیر breakpoint `sm` نمایش داده می‌شود — در Tablet/Desktop
 * به‌جای آن Desktop Header استفاده خواهد شد (Phase جداگانه).
 *
 * استایل بر اساس رفرنس تأییدشده کارفرما: پس‌زمینه رنگی (فعلاً Indigo،
 * هماهنگ با تصمیم موقت Bottom Bar)، دکمه‌های دایره‌ای شیشه‌ای دو طرف
 * عنوان، و — برخلاف رفرنس که پایینش کاملاً صاف/تیز بود — اینجا طبق
 * درخواست صریح کارفرما پایین پس‌زمینه کمی منحنی است (`rounded-b-*`).
 */
export function MobileTopBar() {
  return (
    <header
      className="relative overflow-hidden bg-[var(--color-primary)] pt-[env(safe-area-inset-top)] sm:hidden"
      style={{ borderBottomLeftRadius: 28, borderBottomRightRadius: 28 }}
    >
      <div className="flex h-14 items-center justify-between px-4">
        <Link
          href="/search"
          aria-label="جستجو"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm active:bg-white/25"
        >
          <Search className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
        </Link>

        <h1 className="text-base font-semibold text-white">فرش سقطچی</h1>

        <Link
          href="/notifications"
          aria-label="اعلان‌ها"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm active:bg-white/25"
        >
          <Bell className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
        </Link>
      </div>
    </header>
  );
}
