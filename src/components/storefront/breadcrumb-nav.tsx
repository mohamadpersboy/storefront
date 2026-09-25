import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export type BreadcrumbItem = {
  label: string;
  /** آخرین آیتم معمولاً `href` ندارد (صفحه فعلی، غیرقابل کلیک). */
  href?: string;
};

/**
 * مسیر ناوبری بالای صفحات داخلی (اولین مصرف‌کننده: صفحه اختصاصی
 * دسته‌بندی — «خانه / دسته‌بندی‌ها / فرش ماشینی»). فلش رو‌به‌چپ بین
 * آیتم‌ها چون در RTL جهت طبیعی مسیر همان جهت خواندن (راست‌به‌چپ)
 * است.
 */
export function BreadcrumbNav({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="مسیر ناوبری" className="flex items-center gap-1 overflow-x-auto whitespace-nowrap py-2 text-xs text-[var(--sf-ink)]/50 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <span key={`${item.label}-${index}`} className="flex shrink-0 items-center gap-1">
            {item.href && !isLast ? (
              <Link href={item.href} className="hover:text-[var(--sf-ink)]/80">
                {item.label}
              </Link>
            ) : (
              <span className={isLast ? "font-medium text-[var(--sf-ink)]" : ""}>{item.label}</span>
            )}
            {!isLast ? <ChevronLeft className="size-3 shrink-0" aria-hidden="true" /> : null}
          </span>
        );
      })}
    </nav>
  );
}
