"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Grid3x3, Sparkles, User } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const items = [
  { href: "/", label: "خانه", icon: Home },
  { href: "/products", label: "محصولات", icon: Grid3x3 },
  { href: "/amazing-offers", label: "شگفت‌انگیز", icon: Sparkles },
  { href: "/login", label: "حساب", icon: User },
];

export function MobileTabBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 backdrop-blur sm:hidden">
      <div className="flex items-center justify-around py-1.5">
        {items.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1.5 text-[11px]",
                active ? "text-primary" : "text-muted",
              )}
            >
              <Icon className="size-5" strokeWidth={active ? 2 : 1.75} />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
