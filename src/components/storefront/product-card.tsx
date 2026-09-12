"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { toPersianDigits, formatNumber, TOMAN_GLYPH } from "@/lib/utils/format";

/** فقط وقتی محصول واقعاً یک Amazing Offer فعال هم هست پر می‌شود؛ در غیر این صورت `null`. */
export type ProductCardAmazingOffer = {
  startAt: string;
  endAt: string;
};

export type ProductCardData = {
  id: string;
  product: {
    title: string;
    slug: string;
    imageUrl: string;
    imageBlurDataUrl: string | null;
  };
  /** رنگ‌های دیگر همین طرح فرش (از روی Variantهای دیگر محصول). */
  colors: { id: string; hexCode: string }[];
  basePrice: number;
  /** برابر `basePrice` وقتی تخفیفی در کار نیست. */
  finalPrice: number;
  /**
   * فقط اگر همین محصول یک Amazing Offer فعال هم باشد پر می‌شود (مثلاً
   * در ردیف «جدیدترین‌ها» ممکن است بعضی از محصولات هم‌زمان شگفت‌انگیز
   * هم باشند). وقتی `null`/`undefined` است، برچسب/Progress Bar/تایمر
   * پنهان می‌شوند اما همان فضا رزرو می‌ماند — بند صریح کارفرما — تا
   * ردیف محصولات مخلوط (بعضی Offer دارند بعضی ندارند) هم‌تراز بماند.
   */
  amazingOffer?: ProductCardAmazingOffer | null;
};

/** فقط برای Progress Bar/Countdown — تشخیص نهایی وضعیت Offer همیشه با Backend است (`getAmazingOfferStatus`). */
function useOfferTimer(startAt: string, endAt: string) {
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
  // با گذشت زمان به‌مرور پر می‌شود (نسبت زمان سپری‌شده)، نه خالی.
  const elapsedPercent = Math.min(100, Math.max(0, 100 - (remainingMs / total) * 100));

  const totalSeconds = Math.floor(remainingMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => toPersianDigits(String(n).padStart(2, "0"));
  const label = now === null ? "-- : -- : --" : `${pad(hours)} : ${pad(minutes)} : ${pad(seconds)}`;

  return { elapsedPercent, label };
}

// وقتی محصول Amazing Offer فعال ندارد، هوک باید همچنان صدا زده شود
// (قانون Hooks: نمی‌توان Hook را شرطی صدا زد) — این مقدار بی‌اثر و
// بی‌خطر است چون در این حالت کل بلوک با `invisible` پنهان می‌شود.
const NO_OFFER_FALLBACK = "1970-01-01T00:00:00.000Z";

/**
 * کارت مشترک محصول برای همهٔ ردیف‌های صفحه اصلی (شگفت‌انگیزها،
 * جدیدترین‌ها، پرتخفیف‌ترین‌ها، پرفروش‌ترین‌ها...) — بند ۷/۱۶ Master
 * Workflow: از ساخت کامپوننت Duplicate به‌ازای هر ردیف خودداری شود.
 *
 * بدون بک‌گراند/سایه/Border روی خود کارت؛ کارت‌ها فقط با یک خط ۱px
 * خاکستری (`border-e`) از هم جدا می‌شوند.
 *
 * برچسب «پیشنهاد شگفت‌انگیز» + Progress Bar + تایمر فقط وقتی
 * `amazingOffer` پر باشد نمایش داده می‌شوند؛ در غیر این صورت با
 * `invisible` (نه `hidden`) پنهان می‌شوند تا دقیقاً همان فضا رزرو
 * بماند و ارتفاع کارت‌های یک ردیف مخلوط (بعضی Offer دارند بعضی
 * ندارند) هیچ‌وقت به‌هم نخورد.
 */
export function ProductCard({ item }: { item: ProductCardData }) {
  const offer = item.amazingOffer ?? null;
  const { elapsedPercent, label } = useOfferTimer(
    offer?.startAt ?? NO_OFFER_FALLBACK,
    offer?.endAt ?? NO_OFFER_FALLBACK,
  );

  const hasRealDiscount = item.finalPrice < item.basePrice;
  const discountPercent = hasRealDiscount
    ? Math.round(((item.basePrice - item.finalPrice) / item.basePrice) * 100)
    : 0;

  return (
    <Link
      href={`/products/${item.product.slug}`}
      className="block w-[152px] shrink-0 border-e border-gray-200 px-3 last:border-e-0 sm:w-[168px]"
    >
      <p
        className={`mb-2 text-center text-[11px] font-bold text-[var(--sf-cherry)] ${offer ? "" : "invisible"}`}
      >
        پیشنهاد شگفت‌انگیز
      </p>

      {/* عرض/ارتفاع تصویر عمداً پیکسل ثابت است (نه Aspect Ratio روی
          `w-full`) تا مستقل از Padding/عرض اطراف همیشه یکسان بماند. */}
      <div className="relative h-[171px] w-[128px] overflow-hidden rounded-lg bg-gray-100 sm:h-[192px] sm:w-[144px]">
        <Image
          src={item.product.imageUrl}
          alt={item.product.title}
          fill
          placeholder={item.product.imageBlurDataUrl ? "blur" : "empty"}
          blurDataURL={item.product.imageBlurDataUrl ?? undefined}
          sizes="170px"
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

      {/* ترتیب DOM عمداً برعکسِ ترتیب دیداری متن فارسی است: چون
          Container راست‌به‌چپ است، اولین فرزند سمت راست و آخرین
          فرزند سمت چپ قرار می‌گیرد: درصد تخفیف → راست، قیمت → چپ. */}
      <div className="mt-1.5 flex items-end justify-between gap-1">
        {hasRealDiscount ? (
          <span className="mb-0.5 shrink-0 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
            ٪{toPersianDigits(discountPercent)}
          </span>
        ) : null}
        <div className="text-left">
          <p className="whitespace-nowrap text-xs font-bold text-[var(--sf-ink)]">
            {formatNumber(item.finalPrice)}{" "}
            <span className="relative -top-0.5 text-[9px] font-medium">{TOMAN_GLYPH}</span>
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
      {/* شمارش معکوس عمداً LTR است (حتی داخل صفحهٔ RTL)، وگرنه ترتیب
          ساعت/دقیقه/ثانیه برعکس خوانده می‌شود. */}
      <p
        dir="ltr"
        className={`mt-1 text-left text-xs font-semibold tracking-widest tabular-nums text-[var(--sf-cherry)] ${offer ? "" : "invisible"}`}
      >
        {label}
      </p>
    </Link>
  );
}
