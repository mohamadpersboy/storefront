import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import type { LeanCategoryLite } from "@/lib/storefront/category-listing";

/**
 * چیپ‌های فیلتر زیردسته بالای شبکه محصولات (بند ۳ درخواست) — عمداً
 * `<Link>` ساده است نه Client Component با State، دقیقاً هم‌الگو با
 * `OrderStatusTabs`: تغییر زیردسته یک ناوبری واقعی است (Query Param
 * جدید + بازگشت `page` به ۱ چون در URL مقصد نیست)، پس JS سمت کاربر
 * لازم نیست. سایر فیلترهای فعال (برند/ویژگی/قیمت/مرتب‌سازی/جستجو)
 * با `buildHref` حفظ می‌شوند.
 */
export function SubcategoryTabs({
  subcategories,
  activeSlug,
  buildHref,
}: {
  subcategories: LeanCategoryLite[];
  activeSlug: string | undefined;
  buildHref: (subcategorySlug: string | undefined) => string;
}) {
  if (subcategories.length === 0) return null;

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <Link
        href={buildHref(undefined)}
        className={cn(
          "shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold",
          !activeSlug ? "bg-[var(--sf-accent)] text-white" : "bg-gray-100 text-[var(--sf-ink)]/60",
        )}
      >
        همه
      </Link>
      {subcategories.map((sub) => (
        <Link
          key={sub.id}
          href={buildHref(sub.slug)}
          className={cn(
            "shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold",
            activeSlug === sub.slug ? "bg-[var(--sf-accent)] text-white" : "bg-gray-100 text-[var(--sf-ink)]/60",
          )}
        >
          {sub.name}
        </Link>
      ))}
    </div>
  );
}
