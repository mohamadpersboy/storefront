/**
 * توابع خالص محاسباتی پنل خرید صفحه محصول (`ProductPurchasePanel`) —
 * انتخاب Variant، Stepper تعداد، و «مبلغ این انتخاب». جدا از خود
 * Component نگه داشته شده‌اند تا بدون DOM/JSDOM قابل تست باشند.
 */

export const MIN_QUANTITY = 1;

/**
 * تعداد را بین حداقل ۱ و حداکثر موجودی محدود می‌کند. اگر موجودی ۰
 * باشد (ناموجود)، همچنان ۱ برمی‌گرداند — خودِ UI باید دکمه افزودن
 * به سبد را در این حالت غیرفعال کند، نه اینکه Stepper را با تعداد
 * ۰ نمایش دهد.
 */
export function clampQuantity(quantity: number, stock: number): number {
  const max = Math.max(MIN_QUANTITY, stock);
  return Math.min(max, Math.max(MIN_QUANTITY, Math.round(quantity)));
}

/** مبلغ کل انتخاب فعلی = قیمت نهایی واحد × تعداد. */
export function computeSelectionTotal(finalUnitPrice: number, quantity: number): number {
  return finalUnitPrice * quantity;
}

export type VariantLabelInput = {
  colorName: string | null;
  attributes: { name: string; value: string }[];
  unit: string;
};

/**
 * برچسب نمایشی یک Variant روی Pill انتخاب — اولویت با رنگ + مقادیر
 * ویژگی‌ها (مثلاً «لاکی — ۶×۴ متر»)؛ اگر Variant هیچ رنگ/ویژگی‌ای
 * نداشت (Variant ساده تک‌حالته)، به‌جایش خودِ واحد فروش
 * (`unit`, مثلاً «تخته») نمایش داده می‌شود تا Pill هرگز خالی نماند.
 */
export function getVariantDisplayLabel(variant: VariantLabelInput): string {
  const parts: string[] = [];
  if (variant.colorName) parts.push(variant.colorName);
  for (const attribute of variant.attributes) {
    if (attribute.value) parts.push(attribute.value);
  }
  return parts.length > 0 ? parts.join(" — ") : variant.unit;
}
