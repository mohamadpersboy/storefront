"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { toPersianDigits, formatTomanGlyph } from "@/lib/utils/format";
import { computeAmazingOfferPrice } from "@/lib/utils/amazing-offer";
import type { AmazingOfferDiscountType } from "@/models/AmazingOffer";

export type AmazingOfferCardData = {
  id: string;
  product: {
    title: string;
    slug: string;
    imageUrl: string;
    imageBlurDataUrl: string | null;
  };
  /** رنگ‌های دیگر همین طرح فرش (از روی Variantهای دیگر محصول) — فقط برای نمایش، ربطی به Variant این Offer ندارد. */
  colors: { id: string; hexCode: string }[];
  variant: { basePrice: number };
  discountType: AmazingOfferDiscountType;
  discountValue: number;
  startAt: string;
  endAt: string;
};

/** فقط برای Progress Bar/Countdown — تشخیص نهایی وضعیت Offer همیشه با Backend است (`getAmazingOfferStatus`). */
function useRemainingTime(startAt: string, endAt: string) {
  const start = new Date(startAt).getTime();
  const end = new Date(endAt).getTime();
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const timeout = setTimeout(() => setNow(Date.now()), 0);
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, []);

  const total = Math.max(1, end - start);
  const remainingMs = now === null ? total : Math.max(0, end - now);
  const remainingPercent = Math.min(100, Math.max(0, (remainingMs / total) * 100));

  const totalSeconds = Math.floor(remainingMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => toPersianDigits(String(n).padStart(2, "0"));
  const label = now === null ? "--:--:--" : `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;

  return { remainingPercent, label };
}

/**
 * کارت محصول در ردیف «شگفت‌انگیزها». طبق دستور مستقیم کارفرما،
 * بدون بک‌گراند/سایه/Border روی خود کارت — کارت‌ها فقط با یک خط
 * ۱px خاکستری (`border-e`) از هم جدا می‌شوند.
 *
 * نکته Reusability: خواندن Countdown اینجا نسخهٔ ساده‌شدهٔ همان
 * منطق `AmazingOfferCountdown` در Dashboard است (بند ۷ Master
 * Workflow — از ایجاد کامپوننت تکراری خودداری کن)، با این تفاوت که
 * علاوه‌بر متن، درصد Progress هم لازم دارد (که به `startAt` هم نیاز
 * دارد) بنابراین یک نسخهٔ مستقل و سبک برای Storefront نوشته شد،
 * نه Import مستقیم از کامپوننت Dashboard (که در معماری فعلی از
 * Style/متغیرهای مخصوص Dashboard استفاده می‌کند).
 */
export function AmazingOfferCard({ offer }: { offer: AmazingOfferCardData }) {
  const { remainingPercent, label } = useRemainingTime(offer.startAt, offer.endAt);
  const finalPrice = computeAmazingOfferPrice(
    offer.variant.basePrice,
    offer.discountType,
    offer.discountValue,
  );
  const hasRealDiscount = finalPrice < offer.variant.basePrice;
  const discountPercent =
    offer.discountType === "percent"
      ? offer.discountValue
      : Math.round(((offer.variant.basePrice - finalPrice) / offer.variant.basePrice) * 100);

  return (
    <Link
      href={`/products/${offer.product.slug}`}
      className="block w-[152px] shrink-0 border-e border-gray-200 px-3 first:ps-0 last:border-e-0 sm:w-[168px]"
    >
      <p className="mb-2 text-[11px] font-bold text-[var(--sf-accent)]">پیشنهاد شگفت‌انگیز</p>

      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg bg-gray-100">
        <Image
          src={offer.product.imageUrl}
          alt={offer.product.title}
          fill
          placeholder={offer.product.imageBlurDataUrl ? "blur" : "empty"}
          blurDataURL={offer.product.imageBlurDataUrl ?? undefined}
          sizes="170px"
          className="object-cover"
        />

        {offer.colors.length > 1 ? (
          <div className="absolute end-2 top-2 flex flex-col items-center gap-1 rounded-full bg-white/50 px-1 py-1.5 backdrop-blur-md">
            {offer.colors.slice(0, 4).map((color) => (
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
        {offer.product.title}
      </h3>

      <div className="mt-1.5 flex items-end justify-between gap-1">
        <div>
          <p className="text-sm font-bold text-[var(--sf-ink)]">{formatTomanGlyph(finalPrice)}</p>
          {hasRealDiscount ? (
            <p className="text-[11px] text-gray-400 line-through">
              {formatTomanGlyph(offer.variant.basePrice)}
            </p>
          ) : null}
        </div>
        {hasRealDiscount ? (
          <span className="mb-0.5 shrink-0 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
            ٪{toPersianDigits(discountPercent)}
          </span>
        ) : null}
      </div>

      <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full rounded-full bg-[var(--sf-accent)] transition-[width]"
          style={{ width: `${remainingPercent}%` }}
        />
      </div>
      <p className="mt-1 text-center text-[11px] font-medium tabular-nums text-[var(--sf-ink)]">
        {label}
      </p>
    </Link>
  );
}
