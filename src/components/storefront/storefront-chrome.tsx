"use client";

import { usePathname } from "next/navigation";
import { MobileBottomBar } from "@/components/storefront/mobile-bottom-bar";
import { InstallPrompt } from "@/components/storefront/install-prompt";
import { cn } from "@/lib/utils/cn";

/**
 * مسیرهایی که `MobileBottomBar` سراسری در آن‌ها نمایش داده نمی‌شود
 * — چون خودشان یک نوار پایین چسبان اختصاصی دارند (صفحه محصول:
 * `ProductAddToCartBar`؛ صفحه سبد خرید: دکمه «ثبت نهایی سفارش» در
 * `CartPageClient`). اگر صفحه دیگری هم بعداً به این الگو نیاز
 * داشت، همین‌جا اضافه شود.
 */
const HIDDEN_BOTTOM_BAR_PREFIXES = ["/products/", "/cart"];

/**
 * پوسته Storefront — تصمیم نمایش/عدم‌نمایش `MobileBottomBar`
 * سراسری و فضای رزروشده برای آن، بر اساس مسیر فعلی. جدا از خودِ
 * `layout.tsx` (که Server Component است) چون تشخیص مسیر فعلی برای
 * این تصمیم نیاز به `usePathname` (فقط Client) دارد.
 *
 * وقتی Bottom Bar سراسری پنهان است، دیگر فضای `pb-[76px]` هم رزرو
 * نمی‌شود — چون خودِ آن صفحه (مثل صفحه محصول) مسئول فضای پایین
 * مخصوص نوار خودش است، نه این پوسته مشترک.
 */
export function StorefrontChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideGlobalBottomBar = HIDDEN_BOTTOM_BAR_PREFIXES.some((prefix) =>
    pathname?.startsWith(prefix),
  );

  return (
    <>
      <div className={cn(!hideGlobalBottomBar && "pb-[76px] sm:pb-0")}>{children}</div>
      {!hideGlobalBottomBar && <MobileBottomBar />}
      {!hideGlobalBottomBar && <InstallPrompt />}
    </>
  );
}
