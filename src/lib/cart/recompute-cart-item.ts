import { computeFinalPrice } from "@/lib/utils/pricing";

export interface CartVariantSnapshot {
  price: number;
  discountPercent: number;
  discountAmount: number;
  stock: number;
  isActive: boolean;
  unit: string;
}

export interface RecomputedCartItem {
  unit: string;
  unitPrice: number;
  discountPercent: number;
  discountAmount: number;
  finalUnitPrice: number;
  itemTotal: number;
  isAvailable: boolean;
  unavailableReason: string | null;
}

/**
 * قلب منطق قیمت‌گذاری Cart — تابع خالص (بدون DB)، فقط از روی
 * وضعیت *زنده* Product/Variant که از دیتابیس خوانده شده تصمیم
 * می‌گیرد. هرگز از قیمت/تخفیف ذخیره‌شده قبلی Item یا از چیزی که
 * Client فرستاده استفاده نمی‌کند (بند ۹، ۱۰، ۱۳ سند Audit: «Cart
 * نباید به قیمت‌های قدیمی Client اعتماد کند»).
 *
 * این تابع در هر عملیات Cart (Get/Add/Update/Remove/Validate) دوباره
 * برای تک‌تک Itemها صدا زده می‌شود؛ به همین دلیل کاملاً بدون Side
 * Effect و قابل Unit Test است.
 *
 * @param quantity تعداد درخواستی در Cart
 * @param variant اسنپ‌شات زنده Variant، یا `null` اگر Product/Variant
 *   اصلاً پیدا نشد (حذف کامل شده — بند ۱۵)
 * @param productIsAvailable آیا Product خودش هنوز `published` و
 *   حذف‌نشده است (بند ۱۵-۱۶)
 */
export function recomputeCartItem(
  quantity: number,
  variant: CartVariantSnapshot | null,
  productIsAvailable: boolean,
): RecomputedCartItem {
  const empty = {
    unit: variant?.unit ?? "",
    unitPrice: variant?.price ?? 0,
    discountPercent: 0,
    discountAmount: 0,
    finalUnitPrice: 0,
    itemTotal: 0,
  };

  if (!variant) {
    return { ...empty, isAvailable: false, unavailableReason: "این محصول دیگر وجود ندارد" };
  }

  if (!productIsAvailable || !variant.isActive) {
    return {
      ...empty,
      isAvailable: false,
      unavailableReason: "این محصول یا حالت انتخابی آن دیگر در دسترس نیست",
    };
  }

  if (quantity > variant.stock) {
    return {
      ...empty,
      isAvailable: false,
      unavailableReason:
        variant.stock === 0
          ? "این کالا موجود نیست"
          : `موجودی کافی نیست (حداکثر ${variant.stock} عدد موجود است)`,
    };
  }

  const finalUnitPrice = computeFinalPrice(
    variant.price,
    variant.discountPercent,
    variant.discountAmount,
  );

  return {
    unit: variant.unit,
    unitPrice: variant.price,
    discountPercent: variant.discountPercent,
    discountAmount: variant.discountAmount,
    finalUnitPrice,
    itemTotal: finalUnitPrice * quantity,
    isAvailable: true,
    unavailableReason: null,
  };
}
