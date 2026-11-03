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
        نسخه سوم (درخواست کارفرما: گرادینت زیبا و جذاب): گرادینت مورب
        رز ← صورتی ← نارنجی گرم (هم‌خانواده با رنگ برند Cherry)،
        درخشش آرام عبوری، آیکون تپنده، و تایمر داخل یک Pill شیشه‌ای.
        متن‌ها سفید هستند؛ سایه روی متن/کارت برای خوانایی و عمق.
      */}
      <div
        className="relative isolate flex items-center justify-between gap-2 overflow-hidden rounded-2xl p-3.5 shadow-[0_8px_22px_-8px_rgba(225,29,72,0.55)] ring-1 ring-white/30"
        style={{
          backgroundImage:
            "linear-gradient(115deg, #be123c 0%, #e11d48 32%, #f43f5e 62%, #fb923c 100%)",
        }}
      >
        {/* هاله نور نرم گوشه‌ها */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -left-6 -top-10 -z-10 size-28 rounded-full bg-white/25 blur-2xl"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-12 right-10 -z-10 size-24 rounded-full bg-amber-300/40 blur-2xl"
        />
        {/* درخشش عبوری */}
        <span
          aria-hidden="true"
          className="sf-offer-shimmer pointer-events-none absolute inset-y-0 left-0 -z-10 w-1/4 bg-gradient-to-r from-transparent via-white/35 to-transparent"
        />

        <span className="flex shrink-0 items-center gap-2 text-xs font-bold text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.25)]">
          <span className="flex size-7 items-center justify-center rounded-full bg-white/20 ring-1 ring-white/40 backdrop-blur-sm">
            <Sparkles className="sf-offer-pulse size-4" strokeWidth={2.25} aria-hidden="true" />
          </span>
          پیشنهاد شگفت‌انگیز
        </span>

        {/* شمارش معکوس عمداً LTR است (هم‌الگو با `ProductCard`)، وگرنه
            ترتیب ساعت/دقیقه/ثانیه در صفحه RTL برعکس خوانده می‌شود. */}
        <span
          dir="ltr"
          className="shrink-0 rounded-xl bg-black/20 px-3 py-1.5 text-base font-bold tracking-widest tabular-nums text-white shadow-inner ring-1 ring-white/25 backdrop-blur-sm [text-shadow:0_1px_2px_rgba(0,0,0,0.3)]"
        >
          {label}
        </span>
      </div>
    </div>
  );
}
