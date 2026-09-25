import Link from "next/link";
import Image from "next/image";
import { formatNumber, TOMAN_GLYPH } from "@/lib/utils/format";
import { computeDisplayDiscountPercent } from "@/lib/utils/pricing";
import { toPersianDigits } from "@/lib/utils/format";
import type { ProductCardData } from "@/components/storefront/product-card";

/**
 * کارت محصول برای Grid دو‌ستونه صفحه دسته‌بندی — از همان
 * `ProductCardData` (منبع مشترک `homepage-products.ts`/
 * `category-listing.ts`) استفاده می‌کند، اما چیدمانش با
 * `ProductCard` (عرض ثابت مخصوص اسکرول افقی) فرق دارد: این‌جا
 * عرض کامل ستون خودش را می‌گیرد. طبق قانون «ماژول تأییدشده را
 * تغییر نده»، به‌جای دستکاری `ProductCard` موجود، یک Component
 * مستقل ساخته شد.
 */
export function ProductGridCard({ item }: { item: ProductCardData }) {
  const hasRealDiscount = item.finalPrice < item.basePrice;
  const discountPercent = computeDisplayDiscountPercent(item.basePrice, item.finalPrice);

  return (
    <Link
      href={`/products/${item.product.slug}`}
      className="block overflow-hidden rounded-[var(--radius-lg)] border border-black/5 bg-white"
    >
      <div className="relative aspect-[3/4] w-full bg-gray-100">
        <Image
          src={item.product.imageUrl}
          alt={item.product.title}
          fill
          placeholder={item.product.imageBlurDataUrl ? "blur" : "empty"}
          blurDataURL={item.product.imageBlurDataUrl ?? undefined}
          sizes="(min-width: 1024px) 220px, 50vw"
          className="object-cover"
        />

        {item.colors.length > 1 ? (
          <div className="absolute end-2 top-2 flex flex-col items-center gap-1 rounded-full bg-white/50 px-1 py-1.5 backdrop-blur-md">
            {item.colors.slice(0, 4).map((color) => (
              <span
                key={color.id}
                className="size-2 shrink-0 rounded-full ring-1 ring-white"
                style={{ backgroundColor: color.hexCode }}
              />
            ))}
          </div>
        ) : null}

        {hasRealDiscount ? (
          <span className="absolute start-2 top-2 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
            ٪{toPersianDigits(discountPercent)}
          </span>
        ) : null}
      </div>

      <div className="p-2.5">
        <h3 className="line-clamp-2 min-h-[2.25rem] text-xs leading-[1.125rem] font-medium text-[var(--sf-ink)]">
          {item.product.title}
        </h3>

        <div className="mt-1.5 text-left">
          <p className="whitespace-nowrap text-xs font-bold text-[var(--sf-ink)]">
            {formatNumber(item.finalPrice)} <span className="relative -top-0.5 text-[9px] font-medium">{TOMAN_GLYPH}</span>
          </p>
          {hasRealDiscount ? (
            <p className="text-[10px] text-gray-400 line-through">{formatNumber(item.basePrice)}</p>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
