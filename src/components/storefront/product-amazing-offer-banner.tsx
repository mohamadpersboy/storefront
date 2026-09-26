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
 * `product-card.tsx`) تا منطق Countdown Duplicate نشود — همان
 * تایمر که در همه کارت‌های محصول (صفحه اصلی، دسته‌بندی‌ها،
 * علاقه‌مندی‌ها) استفاده می‌شود، اینجا هم رعایت شده.
 *
 * **اصلاح‌شده طبق دستور صریح بعدی کارفرما:** رنگ خودِ Badge برعکس
 * شد — قبلاً زمینه صورتی‌کم‌رنگ + متن/آیکون قرمز بود، حالا زمینه
 * *یک‌دست قرمز* (`bg-[var(--sf-cherry)]`) با متن/آیکون سفید. نوار
 * Progress هم کامل حذف شد (نه فقط مخفی — دیگر `elapsedPercent` هم
 * از `useOfferTimer` استفاده نمی‌شود)؛ فاصله بین Badge و تایمر حالا
 * با `justify-between` روی خودِ ردیف است، نه یک نوار میانی.
 */
export function ProductAmazingOfferBanner({ offer }: ProductAmazingOfferBannerProps) {
  const { label } = useOfferTimer(offer.startAt, offer.endAt);

  return (
    <div className="flex items-center justify-between gap-2 px-4 pt-4 sm:mx-auto sm:max-w-md sm:px-6">
      <span className="flex shrink-0 items-center gap-1 rounded-full bg-[var(--sf-cherry)] px-2.5 py-1 text-[11px] font-bold text-white">
        <Sparkles className="size-3.5" strokeWidth={2} aria-hidden="true" />
        پیشنهاد شگفت‌انگیز
      </span>

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
