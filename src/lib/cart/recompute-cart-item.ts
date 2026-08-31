import { computeFinalPrice } from "@/lib/utils/pricing";
import { computeAmazingOfferPrice } from "@/lib/utils/amazing-offer";
import type { AmazingOfferDiscountType } from "@/models/AmazingOffer";

export interface CartVariantSnapshot {
  price: number;
  discountPercent: number;
  discountAmount: number;
  stock: number;
  isActive: boolean;
  unit: string;
}

/** یک شگفت‌انگیز *زنده* (بازه زمانی معتبر + isActive) روی همین Variant، اگر باشد. */
export interface CartAmazingOfferSnapshot {
  discountType: AmazingOfferDiscountType;
  discountValue: number;
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
 * @param amazingOffer اگر یک شگفت‌انگیز *زنده* روی همین Variant وجود
 *   داشته باشد. طبق تصمیم صریح کارفرما (Phase 8): بین تخفیف عادی
 *   Variant و شگفت‌انگیز، هرکدام تخفیف بیشتری بدهد اعمال می‌شود —
 *   نه هر دو با هم (که باعث اعمال دوباره تخفیف می‌شد، برخلاف بند ۸
 *   سند Audit).
 */
export function recomputeCartItem(
  quantity: number,
  variant: CartVariantSnapshot | null,
  productIsAvailable: boolean,
  amazingOffer?: CartAmazingOfferSnapshot | null,
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

  const variantFinalPrice = computeFinalPrice(
    variant.price,
    variant.discountPercent,
    variant.discountAmount,
  );

  // پیش‌فرض: تخفیف عادی خود Variant
  let finalUnitPrice = variantFinalPrice;
  let discountPercent = variant.discountPercent;
  let discountAmount = variant.discountAmount;

  if (amazingOffer) {
    const offerFinalPrice = computeAmazingOfferPrice(
      variant.price,
      amazingOffer.discountType,
      amazingOffer.discountValue,
    );
    // فقط اگر شگفت‌انگیز واقعاً تخفیف بیشتری بدهد جایگزین می‌شود —
    // یعنی حداقل قیمت نهایی بین دو منبع تخفیف انتخاب می‌شود.
    if (offerFinalPrice < finalUnitPrice) {
      finalUnitPrice = offerFinalPrice;
      discountPercent = amazingOffer.discountType === "percent" ? amazingOffer.discountValue : 0;
      discountAmount = amazingOffer.discountType === "fixed" ? amazingOffer.discountValue : 0;
    }
  }

  return {
    unit: variant.unit,
    unitPrice: variant.price,
    discountPercent,
    discountAmount,
    finalUnitPrice,
    itemTotal: finalUnitPrice * quantity,
    isAvailable: true,
    unavailableReason: null,
  };
}
