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

export type VariantDetailSegment =
  | { type: "color"; name: string; hex: string | null }
  | { type: "attribute"; name: string; value: string };

export type VariantDetailInput = {
  colorName: string | null;
  colorHex: string | null;
  attributes: { name: string; value: string }[];
};

/**
 * ریز مشخصات Variant انتخاب‌شده — برای خط جداگانه زیر Pillهای
 * انتخاب واحد فروش (طبق دستور صریح کارفرما، جایگزین نسخه قبلی که
 * این اطلاعات را داخل خودِ Pill می‌گذاشت). رنگ (اگر ثبت شده باشد)
 * همیشه اول است؛ بعدش هر ویژگی فنی که هم نام و هم مقدار دارد،
 * به‌ترتیب ثبت‌شده. Component این آرایه را با جداکننده «-» به هم
 * وصل می‌کند و بخش رنگ را با یک دایره رنگی رندر می‌کند.
 */
export function getVariantDetailSegments(variant: VariantDetailInput): VariantDetailSegment[] {
  const segments: VariantDetailSegment[] = [];

  if (variant.colorName) {
    segments.push({ type: "color", name: variant.colorName, hex: variant.colorHex });
  }

  for (const attribute of variant.attributes) {
    if (attribute.name && attribute.value) {
      segments.push({ type: "attribute", name: attribute.name, value: attribute.value });
    }
  }

  return segments;
}
