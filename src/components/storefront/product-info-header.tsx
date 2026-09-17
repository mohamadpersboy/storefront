import { formatNumber, TOMAN_GLYPH, toPersianDigits } from "@/lib/utils/format";
import { computeDisplayDiscountPercent } from "@/lib/utils/pricing";

export type ProductInfoPrice = { basePrice: number; finalPrice: number };

type ProductInfoHeaderProps = {
  title: string;
  price: ProductInfoPrice | null;
};

/**
 * بخش «عنوان + قیمت» صفحه جزئیات محصول — دومین ماژول (بعد از Top
 * Bar + Gallery). طبق دستور صریح، فقط همین دو مورد در Scope‌اند؛
 * Variant/ویژگی/موجودی/افزودن به سبد/توضیحات/محصولات مرتبط/نظرات
 * عمداً اینجا رندر نمی‌شوند — همان محدودیت Master Prompt که در Phase
 * قبلی هم رعایت شد.
 *
 * قیمت از `pickRepresentativeVariant` (ارزان‌ترین Variant فعال/
 * موجود) محاسبه می‌شود — یک قیمت «نماینده/شروع»، نه لزوماً قیمت
 * نهایی سبد خرید، چون انتخاب واقعی Variant توسط کاربر ماژول جداست.
 *
 * هم‌الگو با `ProductCard` برای فرمت اعداد/تخفیف (`formatNumber`،
 * `TOMAN_GLYPH`، `computeDisplayDiscountPercent`) تا در کل Storefront
 * قیمت همیشه یک شکل نمایش داده شود.
 */
export function ProductInfoHeader({ title, price }: ProductInfoHeaderProps) {
  const hasRealDiscount = price !== null && price.finalPrice < price.basePrice;
  const discountPercent = price
    ? computeDisplayDiscountPercent(price.basePrice, price.finalPrice)
    : 0;

  return (
    <section className="px-4 pt-4 sm:mx-auto sm:max-w-md sm:px-6">
      <h1 className="text-base font-bold leading-6 text-[var(--sf-ink)]">{title}</h1>

      {price && (
        <div className="mt-2 flex items-center gap-2">
          {hasRealDiscount && (
            <span className="shrink-0 rounded-full bg-red-500 px-1.5 py-0.5 text-[11px] font-bold text-white">
              ٪{toPersianDigits(discountPercent)}
            </span>
          )}
          <p className="text-lg font-bold text-[var(--sf-ink)]">
            {formatNumber(price.finalPrice)}{" "}
            <span className="text-xs font-medium">{TOMAN_GLYPH}</span>
          </p>
          {hasRealDiscount && (
            <p className="text-xs text-gray-400 line-through">{formatNumber(price.basePrice)}</p>
          )}
        </div>
      )}
    </section>
  );
}
