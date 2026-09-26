"use client";

import Link from "next/link";
import Image from "next/image";
import { toPersianDigits, formatNumber, TOMAN_GLYPH } from "@/lib/utils/format";
import { computeDisplayDiscountPercent } from "@/lib/utils/pricing";
import { useOfferTimer, type ProductCardData } from "@/components/storefront/product-card";

// وقتی محصول Amazing Offer فعال ندارد، Hook باید همچنان صدا زده شود
// (قانون Hooks) — بی‌خطر است چون کل بلوک با `invisible` پنهان می‌شود.
// دقیقاً هم‌الگو با همین ثابت در `ProductCard`.
const NO_OFFER_FALLBACK = "1970-01-01T00:00:00.000Z";

/**
 * کارت محصول Grid دو‌ستونه صفحه دسته‌بندی — عیناً همان الگوی بصری
 * `ProductCard` (کارت اسلایدرهای صفحه اصلی) را تکرار می‌کند: برچسب
 * «پیشنهاد شگفت‌انگیز» بالای عکس، بج تخفیف کنار قیمت، و
 * Progress Bar + شمارش‌معکوس پایین کارت — همه با `invisible` (نه حذف
 * کامل) وقتی محصول Amazing Offer ندارد، تا فضای‌شان همیشه رزرو
 * بماند و کارت‌های Grid هیچ‌وقت با هم اختلاف ارتفاع پیدا نکنند
 * (بازخورد صریح کارفرما).
 *
 * طبق قانون «ماژول تأییدشده را تغییر نده»، به‌جای دستکاری خودِ
 * `ProductCard` (که عرض/تصویرش برای اسکرول افقی پیکسل‌ثابت است)، یک
 * Component مستقل با همان الگو ساخته شد؛ فقط `useOfferTimer` از آن
 * فایل Export و اینجا دوباره‌استفاده شده.
 */
export function ProductGridCard({ item }: { item: ProductCardData }) {
  const offer = item.amazingOffer ?? null;
  const { elapsedPercent, label } = useOfferTimer(
    offer?.startAt ?? NO_OFFER_FALLBACK,
    offer?.endAt ?? NO_OFFER_FALLBACK,
  );

  const hasRealDiscount = item.finalPrice < item.basePrice;
  const discountPercent = computeDisplayDiscountPercent(item.basePrice, item.finalPrice);

  return (
    <Link href={`/products/${item.product.slug}`} className="block">
      <p className={`mb-2 text-center text-[11px] font-bold text-[var(--sf-cherry)] ${offer ? "" : "invisible"}`}>
        پیشنهاد شگفت‌انگیز
      </p>

      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg bg-gray-100">
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
      </div>

      <h3 className="mt-2 line-clamp-2 min-h-[2.25rem] text-xs leading-[1.125rem] font-medium text-[var(--sf-ink)]">
        {item.product.title}
      </h3>

      {/* ترتیب DOM عمداً برعکسِ ترتیب دیداری است (نگاه کنید توضیح مشابه در `ProductCard`):
          درصد تخفیف → راست، قیمت → چپ؛ بج حتی بدون تخفیف رندر می‌شود (با `invisible` پنهان)
          وگرنه با تک‌فرزند شدن ردیف، `justify-between` قیمت را به چپ نمی‌چسباند. */}
      <div className="mt-1.5 flex items-end justify-between gap-1">
        <span
          className={`mb-0.5 shrink-0 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white ${hasRealDiscount ? "" : "invisible"}`}
        >
          ٪{toPersianDigits(discountPercent)}
        </span>
        <div className="text-left">
          <p className="whitespace-nowrap text-xs font-bold text-[var(--sf-ink)]">
            {formatNumber(item.finalPrice)} <span className="relative -top-0.5 text-[9px] font-medium">{TOMAN_GLYPH}</span>
          </p>
          {hasRealDiscount ? (
            <p className="text-[10px] text-gray-400 line-through">{formatNumber(item.basePrice)}</p>
          ) : null}
        </div>
      </div>

      <div
        className={`mt-2 h-1 w-full overflow-hidden rounded-full bg-[var(--sf-cherry-soft)] ${offer ? "" : "invisible"}`}
      >
        <div
          className="h-full rounded-full bg-[var(--sf-cherry)] transition-[width]"
          style={{ width: `${elapsedPercent}%` }}
        />
      </div>
      {/* شمارش معکوس عمداً LTR است، وگرنه ترتیب ساعت/دقیقه/ثانیه برعکس خوانده می‌شود. */}
      <p
        dir="ltr"
        className={`mt-1 text-left text-xs font-semibold tracking-widest tabular-nums text-[var(--sf-cherry)] ${offer ? "" : "invisible"}`}
      >
        {label}
      </p>
    </Link>
  );
}
