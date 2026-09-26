"use client";

import { Sparkles } from "lucide-react";
import { useOfferTimer, type ProductCardAmazingOffer } from "@/components/storefront/product-card";

type ProductAmazingOfferBannerProps = {
  offer: ProductCardAmazingOffer;
};

/**
 * برچسب «پیشنهاد شگفت‌انگیز» + تایمر شمارش معکوس، بالای گالری تصاویر
 * صفحه جزئیات محصول — فقط وقتی رندر می‌شود که همین محصول یک Amazing
 * Offer فعال داشته باشد (`product.amazingOffer` در `get-product-detail.ts`،
 * `null` در غیر این صورت، پس اینجا شرطی رندر می‌شود و برخلاف
 * `ProductCard` نیازی به `invisible`/رزرو فضا نیست).
 *
 * از همان Hook مشترک `useOfferTimer` استفاده می‌کند (اکسپورت‌شده از
 * `product-card.tsx`) تا منطق Progress/Countdown Duplicate نشود —
 * همان الگوی برچسب/تایمر که در همه کارت‌های محصول (صفحه اصلی،
 * دسته‌بندی‌ها، علاقه‌مندی‌ها) استفاده می‌شود، اینجا هم رعایت شده.
 */
export function ProductAmazingOfferBanner({ offer }: ProductAmazingOfferBannerProps) {
  const { elapsedPercent, label } = useOfferTimer(offer.startAt, offer.endAt);

  return (
    <div className="flex items-center gap-2 px-4 pt-4 sm:mx-auto sm:max-w-md sm:px-6">
      <span className="flex shrink-0 items-center gap-1 rounded-full bg-[var(--sf-cherry-soft)] px-2.5 py-1 text-[11px] font-bold text-[var(--sf-cherry)]">
        <Sparkles className="size-3.5" strokeWidth={2} aria-hidden="true" />
        پیشنهاد شگفت‌انگیز
      </span>

      <div className="h-1 flex-1 overflow-hidden rounded-full bg-[var(--sf-cherry-soft)]">
        <div
          className="h-full rounded-full bg-[var(--sf-cherry)] transition-[width]"
          style={{ width: `${elapsedPercent}%` }}
        />
      </div>

      {/* شمارش معکوس عمداً LTR است (هم‌الگو با `ProductCard`)، وگرنه
          ترتیب ساعت/دقیقه/ثانیه در صفحه RTL برعکس خوانده می‌شود. */}
      <span
        dir="ltr"
        className="shrink-0 text-xs font-semibold tracking-widest tabular-nums text-[var(--sf-cherry)]"
      >
        {label}
      </span>
    </div>
  );
}
