"use client";

import { useState } from "react";
import { formatNumber, TOMAN_GLYPH, toPersianDigits } from "@/lib/utils/format";
import { computeDisplayDiscountPercent } from "@/lib/utils/pricing";
import { clampQuantity, mergeCartAddition, type CartAddition } from "@/lib/storefront/product-purchase-math";
import type { ProductDetailVariant } from "@/lib/storefront/get-product-detail";
import { ProductVariantSelector } from "@/components/storefront/product-variant-selector";
import { ProductVariantDetails } from "@/components/storefront/product-variant-details";
import { ProductQuantityStepper } from "@/components/storefront/product-quantity-stepper";
import { ProductAddToCartBar } from "@/components/storefront/product-add-to-cart-bar";
import { ProductCartAdditionsSummary } from "@/components/storefront/product-cart-additions-summary";

type ProductPurchasePanelProps = {
  productId: string;
  variants: ProductDetailVariant[];
  defaultVariantId: string | null;
};

/**
 * پنل خرید صفحه محصول — قیمت + انتخاب Variant + ریز مشخصات +
 * Stepper تعداد + نوار پایین چسبان افزودن به سبد. یک Client
 * Component واحد چون این بخش‌ها State مشترک دارند (Variant
 * انتخاب‌شده و تعداد).
 *
 * **اصلاح‌شده طبق بازخورد کارفرما (نسخه قبلی رنگ/ویژگی‌ها را داخل
 * خودِ Pill می‌گذاشت):** برچسب هر Pill حالا دقیقاً `unit` خودِ
 * Variant است (نگاه کنید `ProductVariantSelector`)، نه ترکیبی از
 * رنگ+ویژگی. رنگ و ویژگی‌های فنی Variant *انتخاب‌شده* در یک خط
 * جدا (`ProductVariantDetails`) زیر Pillها نشان داده می‌شوند.
 *
 * **اصلاح دوم طبق بازخورد کارفرما:** بخش قیمت دیگر کارت
 * (بک‌گراند/سایه) نیست — بدون بک‌گراند، همه اطلاعاتش وسط‌چین. ردیف
 * وضعیت موجودی («موجود در انبار»/نقطه سبز) کامل حذف شد؛ خودِ منطق
 * `isOutOfStock` (غیرفعال‌کردن Stepper/دکمه افزودن به سبد) دست‌نخورده
 * ماند — فقط آن سطر *نمایشی* حذف شد.
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
 * **افزوده‌شده طبق دستور صریح بعدی کارفرما:** `ProductCartAdditionsSummary`
 * بین Stepper تعداد و کارت توضیحات محصول — فهرست Variantهایی که
 * کاربر از همین صفحه با موفقیت به سبد اضافه کرده (تعداد + جمع
 * قیمت هر Variant، هرکدام با دکمه حذف مستقیماً از سبد سرور)، جمع
 * کل هم داخل خودِ دکمه «پرداخت» است (نگاه کنید مستندات خودِ
 * `ProductCartAdditionsSummary`). `additions` یک State محلی همین
 * Component است (نه Fetch از سبد واقعی سرور)؛ فقط بعد از پاسخ
 * *موفق* `ProductAddToCartBar` به‌روز می‌شود (`handleAdded` →
 * `mergeCartAddition`، با `itemId` واقعی از پاسخ API)، و فقط بعد
 * از پاسخ *موفق* حذف واقعی هم یک ردیف پاک می‌شود (`handleRemoved`)
 * — پس هیچ‌وقت وضعیتی را نشان نمی‌دهد که واقعاً روی سرور همین‌طور
 * نباشد.
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
  // فقط State محلی همین بازدید صفحه — نه Fetch از سبد واقعی سرور
  // (نگاه کنید مستندات `ProductCartAdditionsSummary`).
  const [additions, setAdditions] = useState<CartAddition[]>([]);

  const selectedVariant = variants.find((v) => v.id === selectedVariantId) ?? variants[0] ?? null;

  function handleAdded(variantId: string, addedQuantity: number, finalUnitPrice: number, itemId: string) {
    const variant = variants.find((v) => v.id === variantId);
    if (!variant) return;
    setAdditions((current) =>
      mergeCartAddition(current, {
        variantId,
        itemId,
        unitLabel: variant.unit,
        quantity: addedQuantity,
        unitPrice: finalUnitPrice,
      }),
    );
  }

  // بعد از حذف *موفق* واقعی از سبد سرور (خودِ `DELETE` داخل
  // `ProductCartAdditionsSummary` انجام می‌شود) — اینجا فقط همان
  // ردیف از فهرست محلی این صفحه هم پاک می‌شود.
  function handleRemoved(variantId: string) {
    setAdditions((current) => current.filter((a) => a.variantId !== variantId));
  }

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
        {/* قیمت — بدون بک‌گراند، وسط‌چین (طبق دستور صریح کارفرما) */}
        <div className="flex flex-col items-center gap-2 py-1 text-center">
          <div className="flex items-baseline justify-center gap-2">
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
            <div className="flex flex-wrap items-center justify-center gap-2">
              <span className="text-xs text-gray-400 line-through">
                {formatNumber(selectedVariant.price)}
              </span>
              <span className="rounded-full bg-[var(--sf-cherry-soft)] px-2 py-0.5 text-[11px] font-semibold text-[var(--sf-cherry)]">
                {formatNumber(savingsAmount)} {TOMAN_GLYPH} صرفه‌جویی
              </span>
            </div>
          )}
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

      <ProductCartAdditionsSummary additions={additions} onRemoved={handleRemoved} />

      <ProductAddToCartBar
        productId={productId}
        variantId={selectedVariant.id}
        quantity={quantity}
        finalUnitPrice={selectedVariant.finalPrice}
        isOutOfStock={isOutOfStock}
        onAdded={handleAdded}
      />
    </>
  );
}
