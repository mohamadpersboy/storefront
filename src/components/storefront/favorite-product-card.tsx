"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart } from "lucide-react";
import { toPersianDigits, formatNumber, TOMAN_GLYPH } from "@/lib/utils/format";
import { computeDisplayDiscountPercent } from "@/lib/utils/pricing";
import type { ProductCardData } from "@/components/storefront/product-card";

type FavoriteProductCardProps = {
  item: ProductCardData;
  onRemoved: (productId: string) => void;
};

/**
 * کارت محصول مخصوص Grid صفحه «علاقه‌مندی‌ها» — عمداً از `ProductCard`
 * مشترک ردیف‌های صفحه اصلی جدا است: آن کارت عرض ثابت/`shrink-0` دارد
 * (برای اسکرول افقی Carousel) و نباید برای این صفحه Grid دوباره‌کاری
 * شود (بند ۱۲ سند Storefront: ماژول‌های تأییدشده را برای ماژول جدید
 * تغییر نده). فیلدهای قیمت/تخفیف/تصویر دقیقاً هم‌الگو با `ProductCard`
 * (همان `ProductCardData` و همان توابع Format/Pricing) تا رفتار بصری
 * قیمت در کل سایت یکدست بماند.
 *
 * دکمه قلب گوشهٔ کارت = حذف از علاقه‌مندی‌ها (Optimistic UI، همان
 * الگوی `ProductFavoriteButton`): بلافاصله Loading می‌شود، بعد از
 * پاسخ موفق `onRemoved` را صدا می‌زند تا والد (`FavoritesGrid`) آیتم
 * را از لیست محلی حذف کند؛ در خطا فقط حالت Loading برمی‌گردد و آیتم
 * در لیست باقی می‌ماند.
 */
export function FavoriteProductCard({ item, onRemoved }: FavoriteProductCardProps) {
  const [pending, setPending] = useState(false);
  const hasRealDiscount = item.finalPrice < item.basePrice;
  const discountPercent = computeDisplayDiscountPercent(item.basePrice, item.finalPrice);

  async function handleRemove() {
    if (pending) return;
    setPending(true);

    try {
      const response = await fetch("/api/v1/favorites/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: item.id }),
      });

      if (response.ok) {
        onRemoved(item.id);
        return;
      }
    } catch {
      // در ادامه Loading برمی‌گردد و آیتم در لیست باقی می‌ماند.
    }
    setPending(false);
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleRemove}
        disabled={pending}
        aria-label="حذف از علاقه‌مندی‌ها"
        className="absolute end-2 top-2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 text-gray-500 backdrop-blur-md active:bg-white disabled:opacity-60"
      >
        <Heart
          className="h-[18px] w-[18px] fill-[var(--sf-cherry)] text-[var(--sf-cherry)]"
          strokeWidth={1.75}
          aria-hidden="true"
        />
      </button>

      <Link href={`/products/${item.product.slug}`} className="block">
        <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg bg-gray-100">
          <Image
            src={item.product.imageUrl}
            alt={item.product.title}
            fill
            placeholder={item.product.imageBlurDataUrl ? "blur" : "empty"}
            blurDataURL={item.product.imageBlurDataUrl ?? undefined}
            sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 220px"
            className="object-cover"
          />

          {item.colors.length > 1 ? (
            <div className="absolute bottom-2 start-2 flex items-center gap-1 rounded-full bg-white/50 px-1.5 py-1 backdrop-blur-md">
              {item.colors.slice(0, 4).map((color) => (
                <span
                  key={color.id}
                  className="size-2 shrink-0 rounded-full ring-1 ring-white"
                  style={{ backgroundColor: color.hexCode }}
                />
              ))}
            </div>
          ) : null}
        </div>

        <h3 className="mt-2 line-clamp-2 min-h-[2.25rem] text-xs leading-[1.125rem] font-medium text-[var(--sf-ink)]">
          {item.product.title}
        </h3>

        <div className="mt-1.5 flex items-end justify-between gap-1">
          <span
            className={`mb-0.5 shrink-0 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white ${hasRealDiscount ? "" : "invisible"}`}
          >
            ٪{toPersianDigits(discountPercent)}
          </span>

          <div className="text-left">
            <p className="whitespace-nowrap text-[13px] font-bold text-[var(--sf-ink)]">
              {formatNumber(item.finalPrice)}{" "}
              <span className="relative -top-0.5 text-[10px] font-medium">{TOMAN_GLYPH}</span>
            </p>
            {hasRealDiscount ? (
              <p className="text-[10px] text-gray-400 line-through">
                {formatNumber(item.basePrice)}
              </p>
            ) : null}
          </div>
        </div>
      </Link>
    </div>
  );
}
