import { ProductGridCard } from "@/components/storefront/product-grid-card";
import type { ProductCardData } from "@/components/storefront/product-card";

/**
 * Grid دو‌ستونه محصولات صفحه دسته‌بندی (بند ۸ درخواست: «کارت‌ها
 * دو ستون و زیر هم») — همان دو ستون هم در موبایل هم در دسکتاپ (نه
 * ۳-۴ ستون در دسکتاپ)، دقیقاً طبق نمودار ASCII درخواست.
 */
export function ProductGrid({ items }: { items: ProductCardData[] }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map((item) => (
        <ProductGridCard key={item.id} item={item} />
      ))}
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="overflow-hidden rounded-[var(--radius-lg)] border border-black/5 bg-white">
          <div className="aspect-[3/4] w-full animate-pulse bg-gray-200" />
          <div className="space-y-2 p-2.5">
            <div className="h-3 w-full animate-pulse rounded bg-gray-200" />
            <div className="h-3 w-2/3 animate-pulse rounded bg-gray-200" />
            <div className="h-3 w-1/3 animate-pulse rounded bg-gray-200" />
          </div>
        </div>
      ))}
    </div>
  );
}
