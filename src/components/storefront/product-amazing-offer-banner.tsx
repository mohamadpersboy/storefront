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
    <div className="px-4 pt-4 tab:mx-auto tab:max-w-md tab:px-6">
      {/*
        نسخه پنجم (بازخورد کارفرما: ترکیب زرد/نارنجی و قرمز خوشایند نبود):
        رنگ‌ها دقیقاً هم‌رنگ دکمهٔ «مشاهده جزئیات سفارش» اعلان لغوشده
        (حاشیه رز ← قرمز، متن گرادینتی rose-500 ← red-600) روی زمینهٔ سفید؛
        هیچ نارنجی/زردی نمانده. حاشیهٔ گرادینتی با یک المان واحد (`border-2 border-transparent` +
        دو `background` با `padding-box`/`border-box`، هم‌الگو با دکمه‌های
        گرادینتی صفحهٔ اعلان‌ها) روی زمینهٔ بسیار روشن؛ متن‌ها رنگ Cherry.
        تایمر بدون هیچ قاب/Pill، فقط متن.
      */}
      <div
        className="flex items-center justify-between gap-2 rounded-2xl border-2 border-transparent p-3.5"
        style={{
          background:
            "linear-gradient(#ffffff, #ffffff) padding-box, linear-gradient(to left, #fb7185, #ef4444) border-box",
        }}
      >
        <span className="flex shrink-0 items-center gap-1.5 text-xs font-bold">
          <Sparkles className="sf-offer-pulse size-4 text-rose-500" strokeWidth={2.25} aria-hidden="true" />
          <span className="bg-gradient-to-l from-rose-500 to-red-600 bg-clip-text text-transparent">
            پیشنهاد شگفت‌انگیز
          </span>
        </span>

        {/* شمارش معکوس عمداً LTR است (هم‌الگو با `ProductCard`)، وگرنه
            ترتیب ساعت/دقیقه/ثانیه در صفحه RTL برعکس خوانده می‌شود. */}
        <span
          dir="ltr"
          className="shrink-0 bg-gradient-to-l from-rose-500 to-red-600 bg-clip-text text-base font-bold tracking-widest tabular-nums text-transparent"
        >
          {label}
        </span>
      </div>
    </div>
  );
}
