"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, ShoppingCart, Heart, User } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type NavItem = {
  href: string;
  label: string;
  icon: typeof Home;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "خانه", icon: Home },
  { href: "/categories", label: "دسته‌بندی‌ها", icon: LayoutGrid },
  { href: "/cart", label: "سبد خرید", icon: ShoppingCart },
  { href: "/favorites", label: "علاقه‌مندی‌ها", icon: Heart },
  { href: "/account", label: "حساب من", icon: User },
];

/**
 * تعداد ردیف‌های سبد کاربر از `GET /api/v1/cart/count`. Guest (۴۰۱)
 * یا خطا ← ۰ (نشانی نمایش داده نمی‌شود). با هر تغییر مسیر دوباره
 * خوانده می‌شود: افزودن/حذف از سبد فقط در صفحه محصول و سبد انجام
 * می‌شود که این نوار در آن‌ها پنهان است، پس بعد از بازگشت به صفحهٔ
 * دیگر مقدار تازه است.
 */
function useCartCount(pathname: string | null): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/v1/cart/count", { signal: controller.signal, cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((body: { data?: { count?: number } } | null) => {
        setCount(Number(body?.data?.count) || 0);
      })
      .catch(() => {
        // قطع شبکه/Abort: مقدار قبلی می‌ماند.
      });
    return () => controller.abort();
  }, [pathname]);

  return count;
}

/**
 * Bottom Navigation موبایل Storefront.
 *
 * فقط زیر breakpoint `sm` نمایش داده می‌شود (`tab:hidden`) — در
 * Tablet/Desktop به‌جای آن Header استفاده خواهد شد (مرحله بعدی).
 * نشان سبد خرید: تعداد ردیف‌های واقعی سبد (`useCartCount`)؛ وقتی سبد
 * خالی یا کاربر Guest است نشانی دیده نمی‌شود.
 *
 * استایل بر اساس رفرنس تأییدشده کارفرما:
 * - Backdrop شیشه‌ای/شفاف (`backdrop-blur` + پس‌زمینه نیمه‌شفاف)
 * - آیکون/متن غیرفعال خاکستری، بدون Label
 * - فقط زیر آیکون فعال Label نوشته می‌شود
 * - رنگ آیتم فعال فعلاً Indigo همان Token دشبورد (`--color-primary`)
 *   است — پالت مستقل `--sf-*` بعداً روی این بخش اعمال خواهد شد
 * - سایه محو دورتادور آیکون فعال (Glow)
 */
export function MobileBottomBar() {
  const pathname = usePathname();
  const cartItemCount = useCartCount(pathname);

  return (
    <nav
      aria-label="ناوبری اصلی"
      className={cn(
        "fixed inset-x-0 bottom-0 z-40",
        "border-t border-black/5 bg-white/75 backdrop-blur-xl",
        "pb-[env(safe-area-inset-bottom)]",
      )}
    >
      <ul className="grid grid-cols-5">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);

          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={isActive ? "page" : undefined}
                aria-label={label}
                className="flex h-[68px] flex-col items-center justify-center gap-1"
              >
                <span className="relative flex items-center justify-center">
                  <Icon
                    className={cn(
                      "h-6 w-6 transition-colors",
                      isActive
                        ? "text-[var(--color-primary)] drop-shadow-[0_0_10px_rgba(79,70,229,0.45)]"
                        : "text-gray-400",
                    )}
                    strokeWidth={isActive ? 2.25 : 1.75}
                    aria-hidden="true"
                  />
                  {href === "/cart" && cartItemCount > 0 && (
                    <span
                      className="absolute -end-2.5 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--sf-cherry)] px-1 text-[9px] font-bold leading-none text-white ring-2 ring-white"
                      aria-label={`${cartItemCount} کالا در سبد خرید`}
                    >
                      {cartItemCount > 99 ? "99+" : cartItemCount.toLocaleString("fa-IR")}
                    </span>
                  )}
                </span>
                {isActive && (
                  <span className="text-[11px] font-medium text-[var(--color-primary)]">
                    {label}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
