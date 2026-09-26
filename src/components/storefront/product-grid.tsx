import { ProductGridCard } from "@/components/storefront/product-grid-card";
import type { ProductCardData } from "@/components/storefront/product-card";

/**
 * Grid دو‌ستونه محصولات صفحه دسته‌بندی — فقط بین دو ستون یک خط ۱px
 * خاکستری وجود دارد (`border-e` روی ستون راست، هم‌الگو با
 * `border-e`/`last:border-e-0` کارت‌های اسلایدر صفحه اصلی)؛ طبق
 * بازخورد صریح کارفرما، بین ردیف‌ها (بالا/پایین هر کارت) دیگر خط
 * جداکننده‌ای نیست — فقط فاصله (`gap-y`).
 */
export function ProductGrid({ items }: { items: ProductCardData[] }) {
  return (
    <div className="grid grid-cols-2 gap-y-5">
      {items.map((item, index) => (
        <div key={item.id} className={index % 2 === 0 ? "border-e border-gray-200 pe-3" : "ps-3"}>
          <ProductGridCard item={item} />
        </div>
      ))}
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-y-5">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className={index % 2 === 0 ? "border-e border-gray-200 pe-3" : "ps-3"}>
          <div className="mb-2 h-3 w-20 animate-pulse rounded bg-gray-100" />
          <div className="aspect-[3/4] w-full animate-pulse rounded-lg bg-gray-200" />
          <div className="mt-2 space-y-2">
            <div className="h-3 w-full animate-pulse rounded bg-gray-200" />
            <div className="h-3 w-2/3 animate-pulse rounded bg-gray-200" />
          </div>
          <div className="mt-1.5 h-3 w-1/2 animate-pulse rounded bg-gray-200" />
        </div>
      ))}
    </div>
  );
}
