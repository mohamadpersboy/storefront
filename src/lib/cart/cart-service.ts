import type { Types } from "mongoose";
import { Cart, type CartDocument } from "@/models/Cart";
import { Product } from "@/models/Product";
import { Coupon } from "@/models/Coupon";
import { CouponRedemption } from "@/models/CouponRedemption";
import { AmazingOffer } from "@/models/AmazingOffer";
import { recomputeCartItem } from "@/lib/cart/recompute-cart-item";
import { validateCouponEligibility } from "@/lib/discounts/validate-coupon";
import { computeCouponDiscount } from "@/lib/discounts/engine";

interface ProductForCart {
  _id: Types.ObjectId;
  title: string;
  slug: string;
  status: string;
  deletedAt: Date | null;
  images: Array<{ url: string }>;
  variants: Array<{
    _id: Types.ObjectId;
    unit: string;
    price: number;
    discountPercent: number;
    discountAmount: number;
    stock: number;
    isActive: boolean;
  }>;
}

/** یک سبد را برای کاربر پیدا می‌کند، یا اگر نداشت خالی می‌سازد. */
export async function getOrCreateCart(userId: string): Promise<CartDocument> {
  let cart = await Cart.findOne({ user: userId });
  if (!cart) {
    cart = await Cart.create({ user: userId, items: [], cartTotal: 0, appliedCoupon: null });
  }
  return cart;
}

/**
 * وضعیت فعلی کد تخفیف اعمال‌شده روی Cart را (اگر وجود داشته باشد)
 * دوباره اعتبارسنجی می‌کند و مبلغ تخفیف را برمی‌گرداند. از همان توابع
 * خالص Order (بند ۲۷/۴۲ — `validateCouponEligibility` و
 * `computeCouponDiscount`) استفاده می‌کند، نه یک منطق موازی جدید،
 * چون `eligibleAmount` این‌جا (`cart.cartTotal`، یعنی جمع
 * `finalUnitPrice * quantity` بعد از تخفیف Variant) دقیقاً همان
 * `subtotal` است که هنگام ثبت سفارش واقعی محاسبه می‌شود — یعنی همان
 * عددی که کاربر در Cart می‌بیند، در Checkout هم تکرار خواهد شد.
 *
 * اگر کد تخفیف دیگر معتبر نباشد (مثلاً چون Itemها عوض شدند و به
 * حداقل مبلغ نمی‌رسد، یا منقضی/غیرفعال شده)، خودش را از Cart پاک
 * می‌کند — همین‌جا «Discount چند بار روی قیمت اعمال نشود» (بند ۸) هم
 * تضمین می‌شود، چون همیشه حداکثر یک کد فعال روی Cart است.
 */
async function refreshCartCoupon(
  cart: CartDocument,
): Promise<{ amount: number; code: string; discountPercentage: number } | null> {
  if (!cart.appliedCoupon) return null;

  const couponDoc = await Coupon.findById(cart.appliedCoupon.coupon);
  if (!couponDoc) {
    cart.appliedCoupon = null;
    return null;
  }

  const usedByUserCount = await CouponRedemption.countDocuments({
    coupon: couponDoc._id,
    user: cart.user,
  });

  const eligibility = validateCouponEligibility({
    coupon: {
      code: couponDoc.code,
      status: couponDoc.status,
      type: couponDoc.type,
      minOrderAmount: couponDoc.minOrderAmount,
      startsAt: couponDoc.startsAt,
      expiresAt: couponDoc.expiresAt,
      usageLimit: couponDoc.usageLimit,
      usedCount: couponDoc.usedCount,
      perUserLimit: couponDoc.perUserLimit,
      allowedUserIds: couponDoc.allowedUsers.map(String),
    },
    userId: String(cart.user),
    eligibleAmount: cart.cartTotal,
    usedByUserCount,
  });

  if (!eligibility.valid) {
    cart.appliedCoupon = null;
    return null;
  }

  const amount = computeCouponDiscount(
    cart.cartTotal,
    couponDoc.discountPercentage,
    couponDoc.maxDiscountAmount,
  );

  return { amount, code: couponDoc.code, discountPercentage: couponDoc.discountPercentage };
}

export interface CartTotals {
  productMap: Map<string, ProductForCart>;
  discount: { amount: number; code: string; discountPercentage: number } | null;
}

/**
 * تمام Itemهای یک Cart را از روی وضعیت *زنده* Product/Variant دوباره
 * محاسبه می‌کند (قیمت، تخفیف، در دسترس بودن) و `cartTotal` را
 * به‌روزرسانی می‌کند. سند را Save نمی‌کند — این کار به عهده صدازننده
 * است تا در همان درخواست بتوان بعد از Add/Update هم صدا زد.
 *
 * فقط یک Query برای همه محصولات داخل Cart می‌زند (نه یکی به ازای هر
 * Item) — بند «از N+1 Query جلوگیری کنند» در سند Audit، دقیقاً همین‌جا.
 *
 * خروجی Map محصولات را هم برمی‌گرداند تا لایه Serialize مجبور به
 * Query دوباره برای گرفتن عنوان/تصویر محصول نباشد.
 */
export async function recalculateCart(
  cart: CartDocument,
): Promise<CartTotals> {
  const productIds = [...new Set(cart.items.map((item) => String(item.product)))];

  const products = (await Product.find({ _id: { $in: productIds } })
    .select("title slug status deletedAt images variants")
    .lean()) as unknown as ProductForCart[];

  const productMap = new Map(products.map((p) => [String(p._id), p]));

  // بند ۸ سند Audit (Phase 8): اگر یک شگفت‌انگیز *زنده* روی همان
  // Variant وجود داشته باشد، طبق تصمیم کارفرما «بیشترین تخفیف بین
  // شگفت‌انگیز و تخفیف عادی Variant اعمال شود» — نه هر دو با هم. یک
  // Query برای همه محصولات Cart (نه یکی به ازای هر Item).
  const now = new Date();
  const amazingOffers = await AmazingOffer.find({
    productId: { $in: productIds },
    isActive: true,
    startAt: { $lte: now },
    endAt: { $gte: now },
  })
    .select("productId variantId discountType discountValue")
    .lean();
  const amazingOfferMap = new Map(
    amazingOffers.map((o) => [
      `${String(o.productId)}:${String(o.variantId)}`,
      { discountType: o.discountType, discountValue: o.discountValue },
    ]),
  );

  let cartTotal = 0;

  for (const item of cart.items) {
    const product = productMap.get(String(item.product));
    const variant = product?.variants.find((v) => String(v._id) === String(item.variantId));
    const productIsAvailable = product ? product.status === "published" && !product.deletedAt : false;
    const amazingOffer = amazingOfferMap.get(`${String(item.product)}:${String(item.variantId)}`) ?? null;

    const recomputed = recomputeCartItem(
      item.quantity,
      variant
        ? {
            price: variant.price,
            discountPercent: variant.discountPercent,
            discountAmount: variant.discountAmount,
            stock: variant.stock,
            isActive: variant.isActive,
            unit: variant.unit,
          }
        : null,
      productIsAvailable,
      amazingOffer,
    );

    item.unit = recomputed.unit;
    item.unitPrice = recomputed.unitPrice;
    item.discountPercent = recomputed.discountPercent;
    item.discountAmount = recomputed.discountAmount;
    item.finalUnitPrice = recomputed.finalUnitPrice;
    item.itemTotal = recomputed.itemTotal;
    item.isAvailable = recomputed.isAvailable;
    item.unavailableReason = recomputed.unavailableReason;

    if (recomputed.isAvailable) cartTotal += recomputed.itemTotal;
  }

  cart.cartTotal = cartTotal;

  // کد تخفیف باید *بعد* از نهایی‌شدن cartTotal دوباره اعتبارسنجی شود
  // (اگر Itemها تغییر کرده باشند، حداقل مبلغ ممکن است دیگر برقرار
  // نباشد).
  const discount = await refreshCartCoupon(cart);

  return { productMap, discount };
}

export interface ApplyCouponResult {
  success: boolean;
  reason?: string;
}

/**
 * اعمال یک کد تخفیف جدید روی Cart. قبل از Persist کردن، همان
 * `validateCouponEligibility` را روی `cart.cartTotal` فعلی اجرا
 * می‌کند — پس صدا زدن این تابع باید همیشه *بعد* از یک `recalculateCart`
 * تازه باشد تا `cartTotal` به‌روز باشد (در Route رعایت شده است).
 */
export async function applyCouponToCart(
  cart: CartDocument,
  code: string,
): Promise<ApplyCouponResult> {
  const couponDoc = await Coupon.findOne({ code: code.trim().toUpperCase() });
  if (!couponDoc) {
    return { success: false, reason: "کد تخفیف یافت نشد" };
  }

  const usedByUserCount = await CouponRedemption.countDocuments({
    coupon: couponDoc._id,
    user: cart.user,
  });

  const eligibility = validateCouponEligibility({
    coupon: {
      code: couponDoc.code,
      status: couponDoc.status,
      type: couponDoc.type,
      minOrderAmount: couponDoc.minOrderAmount,
      startsAt: couponDoc.startsAt,
      expiresAt: couponDoc.expiresAt,
      usageLimit: couponDoc.usageLimit,
      usedCount: couponDoc.usedCount,
      perUserLimit: couponDoc.perUserLimit,
      allowedUserIds: couponDoc.allowedUsers.map(String),
    },
    userId: String(cart.user),
    eligibleAmount: cart.cartTotal,
    usedByUserCount,
  });

  if (!eligibility.valid) {
    return { success: false, reason: eligibility.reason };
  }

  cart.appliedCoupon = { coupon: couponDoc._id, code: couponDoc.code };
  return { success: true };
}

export function serializeCart(
  cart: CartDocument,
  productMap: Map<string, ProductForCart>,
  discount: { amount: number; code: string; discountPercentage: number } | null,
) {
  const discountAmount = discount?.amount ?? 0;
  return {
    id: String(cart._id),
    items: cart.items.map((item) => {
      const product = productMap.get(String(item.product));
      return {
        id: String(item._id),
        product: product
          ? {
              id: String(product._id),
              title: product.title,
              slug: product.slug,
              image: product.images[0]?.url ?? null,
            }
          : null,
        variantId: String(item.variantId),
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: item.unitPrice,
        discountPercent: item.discountPercent,
        discountAmount: item.discountAmount,
        finalUnitPrice: item.finalUnitPrice,
        itemTotal: item.itemTotal,
        isAvailable: item.isAvailable,
        unavailableReason: item.unavailableReason,
      };
    }),
    cartTotal: cart.cartTotal,
    appliedCoupon: discount ? { code: discount.code, discountPercentage: discount.discountPercentage } : null,
    discountAmount,
    grandTotal: Math.max(0, cart.cartTotal - discountAmount),
    itemCount: cart.items.reduce((sum, item) => sum + item.quantity, 0),
    updatedAt: cart.updatedAt,
  };
}
