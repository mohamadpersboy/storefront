"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart } from "lucide-react";
import { toPersianDigits, formatNumber, TOMAN_GLYPH } from "@/lib/utils/format";
import { computeDisplayDiscountPercent } from "@/lib/utils/pricing";
import {
  useOfferTimer,
  NO_OFFER_FALLBACK,
  type ProductCardData,
} from "@/components/storefront/product-card";

type FavoriteProductCardProps = {
  item: ProductCardData;
  onRemoved: (productId: string) => void;
};

/**
 * کارت افقی صفحه «علاقه‌مندی‌ها» — به درخواست صریح کارفرما، هم‌الگو
 * با ردیف Item صفحه سبد خرید (`CartItemRow`: عکس راست/محتوا چپ، کارت
 * سفید با Border ملایم)، اما بدون کنترل تعداد (چون اینجا هنوز محصولی
 * به سبد اضافه نشده) و با جزئیات بیشتر: نقطه‌های رنگ، برچسب تخفیف
 * شگفت‌انگیز (`amazingOffer`) در کنار تخفیف عادی. عکس کمی بزرگ‌تر از
 * سبد خرید (`size-20`/۸۰px) — این‌جا `size-24`/۹۶px، چون این صفحه
 * محل تصمیم‌گیری خرید است نه فقط مرور سریع.
 *
 * نسخه قبلی این Component یک کارت عمودی مخصوص Grid بود؛ طبق همان
 * دستور، به‌جای نگه‌داشتن هر دو نسخه، مستقیم جایگزین شد (بدون کد
 * Dead جامانده) — Grid عمودی دیگر در این صفحه استفاده نمی‌شود.
 */
export function FavoriteProductCard({ item, onRemoved }: FavoriteProductCardProps) {
  const [pending, setPending] = useState(false);
  const offer = item.amazingOffer ?? null;
  const { elapsedPercent, label } = useOfferTimer(
    offer?.startAt ?? NO_OFFER_FALLBACK,
    offer?.endAt ?? NO_OFFER_FALLBACK,
  );
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
    <div className="flex gap-3 rounded-[var(--radius-lg)] border border-black/5 bg-white p-3">
      <Link href={`/products/${item.product.slug}`} className="shrink-0">
        <div className="relative size-24 overflow-hidden rounded-[var(--radius-md)] bg-gray-100">
          <Image
            src={item.product.imageUrl}
            alt={item.product.title}
            fill
            sizes="96px"
            placeholder={item.product.imageBlurDataUrl ? "blur" : "empty"}
            blurDataURL={item.product.imageBlurDataUrl ?? undefined}
            className="object-cover"
          />
        </div>

        {item.colors.length > 1 ? (
          <div className="mt-1.5 flex items-center justify-center gap-1">
            {item.colors.slice(0, 5).map((color) => (
              <span
                key={color.id}
                className="size-2.5 shrink-0 rounded-full ring-1 ring-black/10"
                style={{ backgroundColor: color.hexCode }}
              />
            ))}
          </div>
        ) : null}
      </Link>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* برچسب «شگفت‌انگیز» + تایمر همیشه بالای عنوان، در یک ردیف؛
            نوار Progress فضای خالی بین برچسب و تایمر را پر می‌کند —
            وقتی Offer فعالی نیست با `invisible` پنهان می‌شود اما فضا
            رزرو می‌ماند (هم‌الگو با `ProductCard`). */}
        <div className={`mb-1.5 flex items-center gap-2 ${offer ? "" : "invisible"}`}>
          <span className="shrink-0 text-[11px] font-bold text-[var(--sf-cherry)]">
            پیشنهاد شگفت‌انگیز
          </span>
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-[var(--sf-cherry-soft)]">
            <div
              className="h-full rounded-full bg-[var(--sf-cherry)] transition-[width]"
              style={{ width: `${elapsedPercent}%` }}
            />
          </div>
          <span
            dir="ltr"
            className="shrink-0 text-[11px] font-semibold tracking-widest tabular-nums text-[var(--sf-cherry)]"
          >
            {label}
          </span>
        </div>

        <div className="flex items-start justify-between gap-2">
          <Link
            href={`/products/${item.product.slug}`}
            className="line-clamp-2 text-xs font-bold leading-5 text-[var(--sf-ink)]"
          >
            {item.product.title}
          </Link>
          <button
            type="button"
            onClick={handleRemove}
            disabled={pending}
            aria-label="حذف از علاقه‌مندی‌ها"
            className="shrink-0 text-gray-300 active:text-[var(--sf-cherry)] disabled:opacity-50"
          >
            <Heart
              className="size-4 fill-[var(--sf-cherry)] text-[var(--sf-cherry)]"
              strokeWidth={1.75}
              aria-hidden="true"
            />
          </button>
        </div>

        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <span
            className={`mb-0.5 shrink-0 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white ${hasRealDiscount ? "" : "invisible"}`}
          >
            ٪{toPersianDigits(discountPercent)}
          </span>

          <div className="text-left">
            <p className="whitespace-nowrap text-sm font-bold text-[var(--sf-ink)]">
              {formatNumber(item.finalPrice)}{" "}
              <span className="relative -top-0.5 text-[9px] font-medium">{TOMAN_GLYPH}</span>
            </p>
            {hasRealDiscount ? (
              <p className="text-[10px] text-gray-400 line-through">
                {formatNumber(item.basePrice)}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
