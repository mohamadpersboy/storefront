import Link from "next/link";
import Image from "next/image";
import { toPersianDigits, formatNumber, TOMAN_GLYPH } from "@/lib/utils/format";
import { computeDisplayDiscountPercent } from "@/lib/utils/pricing";
import type { ProductCardData } from "@/components/storefront/product-card";

/**
 * کارت محصول Grid دو‌ستونه صفحه دسته‌بندی — عمداً همان الگوی
 * بصری/DOM «بدون بک‌گراند/سایه/Border روی خود کارت» را از
 * `ProductCard` (کارت اسلایدرهای صفحه اصلی) تکرار می‌کند: برچسب
 * «پیشنهاد شگفت‌انگیز» بالای عکس و بج تخفیف کنار قیمت هر دو با
 * `invisible` (نه حذف کامل) پنهان می‌شوند تا فضای‌شان همیشه رزرو
 * بماند — دقیقاً همان دلیل قبلی: کارت‌های یک ردیف/Grid هیچ‌وقت با
 * هم اختلاف ارتفاع پیدا نکنند. خط جداکننده بین کارت‌ها را خودِ
 * `ProductGrid` (با `border-e`/`border-b` روی هر سلول) اضافه می‌کند،
 * نه این Component — چون این‌جا برخلاف اسکرول افقی، هم مرز راست/چپ
 * هم بالا/پایین لازم است.
 *
 * طبق قانون «ماژول تأییدشده را تغییر نده»، به‌جای دستکاری خودِ
 * `ProductCard` (که عرض/تصویرش برای اسکرول افقی پیکسل‌ثابت است)، یک
 * Component مستقل با همان الگو ساخته شد.
 */
export function ProductGridCard({ item }: { item: ProductCardData }) {
  const hasOffer = Boolean(item.amazingOffer);
  const hasRealDiscount = item.finalPrice < item.basePrice;
  const discountPercent = computeDisplayDiscountPercent(item.basePrice, item.finalPrice);

  return (
    <Link href={`/products/${item.product.slug}`} className="block">
      <p className={`mb-2 text-center text-[11px] font-bold text-[var(--sf-cherry)] ${hasOffer ? "" : "invisible"}`}>
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
    </Link>
  );
}
