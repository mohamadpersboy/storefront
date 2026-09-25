import { ProductGridCard } from "@/components/storefront/product-grid-card";
import type { ProductCardData } from "@/components/storefront/product-card";

/**
 * Grid دو‌ستونه محصولات صفحه دسته‌بندی (بند ۸ درخواست) — کارت‌ها
 * بدون بک‌گراند/Border مستقل هستند؛ فقط با یک خط ۱px خاکستری از هم
 * جدا می‌شوند: `border-e` بین دو ستون (فقط روی ستون راست، چون در
 * RTL همان چیزی است که بین دو ستون قرار می‌گیرد) و `border-b` بین
 * ردیف‌ها — دقیقاً همان تکنیک `border-e`/`last:border-e-0` که
 * `ProductCard` برای اسلایدرهای صفحه اصلی استفاده می‌کند، فقط برای
 * یک Grid دوبعدی به‌جای اسکرول یک‌طرفه.
 */
export function ProductGrid({ items }: { items: ProductCardData[] }) {
  return (
    <div className="grid grid-cols-2">
      {items.map((item, index) => (
        <div
          key={item.id}
          className={`border-b border-gray-200 py-3 ${index % 2 === 0 ? "border-e pe-3" : "ps-3"}`}
        >
          <ProductGridCard item={item} />
        </div>
      ))}
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={`border-b border-gray-200 py-3 ${index % 2 === 0 ? "border-e pe-3" : "ps-3"}`}
        >
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
