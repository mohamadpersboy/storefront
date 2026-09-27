"use client";

import { Sparkles } from "lucide-react";
import { useOfferTimer, type ProductCardAmazingOffer } from "@/components/storefront/product-card";

type ProductAmazingOfferBannerProps = {
  offer: ProductCardAmazingOffer;
};

/**
 * کارت «پیشنهاد شگفت‌انگیز» بالای گالری تصاویر صفحه جزئیات محصول —
 * فقط وقتی رندر می‌شود که همین محصول یک Amazing Offer فعال داشته
 * باشد (`product.amazingOffer` در `get-product-detail.ts`، `null`
 * در غیر این صورت — پس اینجا شرطی رندر می‌شود، برخلاف `ProductCard`
 * که برای هم‌ترازی ردیف با `invisible` فضا رزرو می‌کند؛ این صفحه
 * تک‌محصولی است، نیازی به آن نیست).
 *
 * از همان Hook مشترک `useOfferTimer` استفاده می‌کند (اکسپورت‌شده از
 * `product-card.tsx`) تا منطق Countdown Duplicate نشود.
 *
 * **نسخه دوم، طبق دستور دقیق بعدی کارفرما (نسخه اول یک Badge
 * جداگانه گرد + نوار Progress بود):**
 * - دیگر یک Badge/Pill مجزا برای برچسب نیست — برچسب و تایمر هر دو
 *   *داخل یک کارت واحد* هستند: زمینه قرمز کم‌رنگ
 *   (`bg-[var(--sf-cherry-soft)]`) + مرز قرمز پررنگ
 *   (`border-2 border-[var(--sf-cherry)]`)، با Padding.
 * - برچسب سمت راست (اول در DOM، چون RTL)، تایمر سمت چپ
 *   (`justify-between`).
 * - فونت تایمر کمی بزرگ‌تر از قبل (`text-base` به‌جای `text-xs`) و
 *   وزن ۳۰۰ (`font-light`) — برخلاف بقیه اعداد/قیمت‌های صفحه که
 *   `font-semibold`/`font-bold` هستند، اینجا عمداً سبک‌تر خواسته شد.
 */
export function ProductAmazingOfferBanner({ offer }: ProductAmazingOfferBannerProps) {
  const { label } = useOfferTimer(offer.startAt, offer.endAt);

  return (
    <div className="px-4 pt-4 sm:mx-auto sm:max-w-md sm:px-6">
      <div className="flex items-center justify-between gap-2 rounded-2xl border-2 border-[var(--sf-cherry)] bg-[var(--sf-cherry-soft)] p-3.5">
        <span className="flex shrink-0 items-center gap-1.5 text-xs font-bold text-[var(--sf-cherry)]">
          <Sparkles className="size-4" strokeWidth={2} aria-hidden="true" />
          پیشنهاد شگفت‌انگیز
        </span>

        {/* شمارش معکوس عمداً LTR است (هم‌الگو با `ProductCard`)، وگرنه
            ترتیب ساعت/دقیقه/ثانیه در صفحه RTL برعکس خوانده می‌شود. */}
        <span
          dir="ltr"
          className="shrink-0 text-base font-light tracking-widest tabular-nums text-[var(--sf-cherry)]"
        >
          {label}
        </span>
      </div>
    </div>
  );
}
