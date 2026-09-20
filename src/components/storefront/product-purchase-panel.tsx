"use client";

import { useState } from "react";
import { formatNumber, TOMAN_GLYPH, toPersianDigits } from "@/lib/utils/format";
import { computeDisplayDiscountPercent } from "@/lib/utils/pricing";
import { clampQuantity } from "@/lib/storefront/product-purchase-math";
import type { ProductDetailVariant } from "@/lib/storefront/get-product-detail";
import { ProductVariantSelector } from "@/components/storefront/product-variant-selector";
import { ProductVariantDetails } from "@/components/storefront/product-variant-details";
import { ProductQuantityStepper } from "@/components/storefront/product-quantity-stepper";
import { ProductAddToCartBar } from "@/components/storefront/product-add-to-cart-bar";

type ProductPurchasePanelProps = {
  productId: string;
  variants: ProductDetailVariant[];
  defaultVariantId: string | null;
};

/**
 * پنل خرید صفحه محصول — قیمت/موجودی + انتخاب Variant + ریز
 * مشخصات + Stepper تعداد + نوار پایین چسبان افزودن به سبد. یک
 * Client Component واحد چون این بخش‌ها State مشترک دارند (Variant
 * انتخاب‌شده و تعداد).
 *
 * **اصلاح‌شده طبق بازخورد کارفرما (نسخه قبلی رنگ/ویژگی‌ها را داخل
 * خودِ Pill می‌گذاشت):** برچسب هر Pill حالا دقیقاً `unit` خودِ
 * Variant است (نگاه کنید `ProductVariantSelector`)، نه ترکیبی از
 * رنگ+ویژگی. رنگ و ویژگی‌های فنی Variant *انتخاب‌شده* در یک خط
 * جدا (`ProductVariantDetails`) زیر Pillها نشان داده می‌شوند —
 * رنگ (اگر ثبت شده) با یک دایره هم‌رنگ، بعدش هر ویژگی با عنوان و
 * مقدار با هم («عرض: ۲ متر»)، با «-» جدا از هم.
 *
 * تغییر Variant، تعداد را به ۱ برمی‌گرداند — موجودی Variant قبلی
 * ربطی به Variant تازه ندارد، پس ادامه‌دادن با همان عدد قبلی
 * می‌توانست بیشتر از موجودی جدید باشد.
 *
 * فاصله رزروشده برای نوار پایین چسبان دیگر اینجا نیست — به آخر
 * `page.tsx` منتقل شد (باگ رفع‌شده: قبلاً بین Stepper تعداد و کارت
 * توضیحات یک فاصله بزرگ بی‌معنی ایجاد می‌کرد، چون این پنل همیشه
 * قبل از توضیحات رندر می‌شد، نه لزوماً آخرین بخش صفحه).
 *
 * عمداً بدون بخش «خاستگاه» (رفرنس دارد ولی محصول فرش معادلی ندارد)
 * و بدون توضیحات/ویژگی‌های فنی *عمومی محصول* (طبق دستور صریح
 * کارفرما: فعلاً طراحی نشود تا دستور بعدی) — این با ویژگی‌های فنی
 * *مختص هر Variant* در `ProductVariantDetails` فرق دارد که همان
 * دستور فعلی صریحاً خواسته.
 */
export function ProductPurchasePanel({
  productId,
  variants,
  defaultVariantId,
}: ProductPurchasePanelProps) {
  const [selectedVariantId, setSelectedVariantId] = useState(
    defaultVariantId ?? variants[0]?.id ?? "",
  );
  const [quantity, setQuantity] = useState(1);

  const selectedVariant = variants.find((v) => v.id === selectedVariantId) ?? variants[0] ?? null;

  function handleSelectVariant(variantId: string) {
    setSelectedVariantId(variantId);
    setQuantity(1);
  }

  function handleQuantityChange(nextQuantity: number) {
    if (!selectedVariant) return;
    setQuantity(clampQuantity(nextQuantity, selectedVariant.stock));
  }

  if (!selectedVariant) return null;

  const hasRealDiscount = selectedVariant.finalPrice < selectedVariant.price;
  const discountPercent = hasRealDiscount
    ? computeDisplayDiscountPercent(selectedVariant.price, selectedVariant.finalPrice)
    : 0;
  const savingsAmount = selectedVariant.price - selectedVariant.finalPrice;
  const isOutOfStock = selectedVariant.stock === 0 || !selectedVariant.isActive;

  return (
    <>
      <section className="flex flex-col gap-3 px-4 pt-3 sm:mx-auto sm:max-w-md sm:px-6">
        {/* قیمت + موجودی */}
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-extrabold text-[var(--sf-ink)]">
              {formatNumber(selectedVariant.finalPrice)}{" "}
              <span className="text-xs font-medium text-gray-400">{TOMAN_GLYPH}</span>
            </p>
            {hasRealDiscount && (
              <span className="shrink-0 rounded-md bg-[var(--sf-cherry)] px-1.5 py-0.5 text-[11px] font-bold text-white">
                ٪{toPersianDigits(discountPercent)}
              </span>
            )}
          </div>

          {hasRealDiscount && (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="text-xs text-gray-400 line-through">
                {formatNumber(selectedVariant.price)}
              </span>
              <span className="rounded-full bg-[var(--sf-cherry-soft)] px-2 py-0.5 text-[11px] font-semibold text-[var(--sf-cherry)]">
                {formatNumber(savingsAmount)} {TOMAN_GLYPH} صرفه‌جویی
              </span>
            </div>
          )}

          <div className="mt-3 flex items-center gap-1.5 border-t border-gray-100 pt-3 text-xs font-medium">
            <span
              className={`h-1.5 w-1.5 rounded-full ${isOutOfStock ? "bg-gray-300" : "bg-green-500"}`}
              aria-hidden="true"
            />
            <span className={isOutOfStock ? "text-gray-400" : "text-green-600"}>
              {isOutOfStock ? "ناموجود" : "موجود در انبار"}
            </span>
          </div>
        </div>

        <ProductVariantSelector
          variants={variants}
          selectedVariantId={selectedVariant.id}
          onSelect={handleSelectVariant}
        />

        <ProductVariantDetails
          colorName={selectedVariant.colorName}
          colorHex={selectedVariant.colorHex}
          attributes={selectedVariant.attributes}
        />

        {!isOutOfStock && (
          <ProductQuantityStepper
            quantity={quantity}
            stock={selectedVariant.stock}
            finalUnitPrice={selectedVariant.finalPrice}
            onChange={handleQuantityChange}
          />
        )}
      </section>

      <ProductAddToCartBar
        productId={productId}
        variantId={selectedVariant.id}
        quantity={quantity}
        finalUnitPrice={selectedVariant.finalPrice}
        isOutOfStock={isOutOfStock}
      />
    </>
  );
}
