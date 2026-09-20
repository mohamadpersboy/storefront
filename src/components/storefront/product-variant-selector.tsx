import { Check } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { formatNumber, TOMAN_GLYPH } from "@/lib/utils/format";
import { getVariantDisplayLabel } from "@/lib/storefront/product-purchase-math";
import type { ProductDetailVariant } from "@/lib/storefront/get-product-detail";

type ProductVariantSelectorProps = {
  variants: ProductDetailVariant[];
  selectedVariantId: string;
  onSelect: (variantId: string) => void;
};

/**
 * انتخاب Variant — به‌صورت Pill تخت (نه Matrix ویژگی‌ها/رنگ)، چون
 * رفرنس کارفرما (میوه‌فروشی) هم دقیقاً همین سطح ساده را دارد («۱
 * کیلوگرم» / «۱ جعبه»، نه یک انتخاب‌گر چندمرحله‌ای رنگ+اندازه) —
 * طبق درخواست «تغییرات جزئی»، نه بازطراحی کامل الگوی انتخاب. هر
 * Pill برچسبش را از `getVariantDisplayLabel` می‌گیرد (رنگ + مقادیر
 * ویژگی‌ها، یا در نبود آن‌ها خودِ واحد فروش) و قیمت نهایی همان
 * Variant را زیرش نشان می‌دهد. Variant غیرفعال یا ناموجود، غیرقابل
 * انتخاب و کم‌رنگ است، با برچسب «ناموجود».
 */
export function ProductVariantSelector({
  variants,
  selectedVariantId,
  onSelect,
}: ProductVariantSelectorProps) {
  if (variants.length <= 1) return null;

  return (
    <div>
      <p className="mb-2 text-sm font-semibold text-[var(--sf-ink)]">انتخاب واحد فروش</p>
      <div className="flex flex-wrap gap-2">
        {variants.map((variant) => {
          const isSelected = variant.id === selectedVariantId;
          const isDisabled = !variant.isActive || variant.stock === 0;
          const label = getVariantDisplayLabel(variant);

          return (
            <button
              key={variant.id}
              type="button"
              disabled={isDisabled}
              onClick={() => onSelect(variant.id)}
              aria-pressed={isSelected}
              className={cn(
                "relative min-w-[92px] rounded-2xl px-4 py-2.5 text-start transition-colors",
                isDisabled
                  ? "cursor-not-allowed border border-gray-200 bg-gray-50 text-gray-300"
                  : isSelected
                    ? "bg-[var(--sf-accent)] text-white shadow-sm"
                    : "border border-gray-200 bg-white text-[var(--sf-ink)] active:bg-gray-50",
              )}
            >
              {isSelected && !isDisabled && (
                <span className="absolute -top-1.5 -end-1.5 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-[var(--sf-accent)]">
                  <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} aria-hidden="true" />
                </span>
              )}
              <span className="block text-xs font-bold">{label}</span>
              <span className={cn("mt-0.5 block text-[11px]", isSelected ? "text-white/90" : "text-gray-500")}>
                {isDisabled ? "ناموجود" : `${formatNumber(variant.finalPrice)} ${TOMAN_GLYPH}`}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
