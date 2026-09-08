"use client";

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
 * Bottom Navigation موبایل Storefront.
 *
 * فقط زیر breakpoint `sm` نمایش داده می‌شود (`sm:hidden`) — در
 * Tablet/Desktop به‌جای آن Header استفاده خواهد شد (مرحله بعدی).
 * `itemCount` سبد خرید فعلاً همیشه صفر است چون این مرحله فقط
 * Navigation را می‌سازد، نه اتصال به Cart واقعی (که نیاز به Login
 * دارد) — یک صفر واقعی، نه یک عدد ساختگی.
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
  const cartItemCount = 0;

  return (
    <nav
      aria-label="ناوبری اصلی"
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 sm:hidden",
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
                    <span className="absolute -end-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--color-primary)] px-1 text-[9px] font-bold leading-none text-white">
                      {cartItemCount > 99 ? "99+" : cartItemCount}
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
