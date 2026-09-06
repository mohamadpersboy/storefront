import { Order } from "@/models/Order";
import { Product } from "@/models/Product";
import { User, type UserDocument } from "@/models/User";
import { Coupon, type CouponDocument } from "@/models/Coupon";
import { CouponRedemption } from "@/models/CouponRedemption";
import { getDiscountSettings } from "@/models/DiscountSettings";
import { getNextSequence } from "@/models/Counter";
import { computeFinalPrice, computePrepayment, type PaymentMethod } from "@/lib/utils/pricing";
import { resolveOrderDiscount } from "@/lib/discounts/engine";
import { validateCouponEligibility } from "@/lib/discounts/validate-coupon";
import {
  reserveCouponUsage,
  releaseCouponReservation,
  recordCouponRedemption,
  CouponRedemptionError,
} from "@/lib/discounts/redeem-coupon";

const ORDER_NUMBER_OFFSET = 10_000;

export class OrderCreationError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export interface CreateOrderParams {
  customerId: string;
  items: Array<{ productId: string; variantId: string; quantity: number }>;
  shippingAddress: {
    recipientName: string;
    phoneNumber: string;
    province: string;
    city: string;
    addressLine: string;
    postalCode: string;
    latitude?: number;
    longitude?: number;
  };
  shippingCost: number;
  paymentMethod: PaymentMethod;
  prepaymentPercent?: number;
  couponCode?: string;
  notes?: string;
  /** کاربری که این سفارش را ایجاد می‌کند — ادمین (Dashboard) یا خود مشتری (Checkout) */
  actorId: string;
}

/**
 * منطق واقعی ایجاد سفارش — از `POST /api/v1/orders` (مسیر Dashboard،
 * فقط برای Staff) استخراج شد تا `POST /api/v1/checkout` (مسیر جدید،
 * برای خود مشتری از روی Cart) بدون Duplicate کردن این منطق حساس
 * (بازمحاسبه قیمت از DB، رزرو Atomic کد تخفیف، کسر موجودی) از همان
 * تابع استفاده کند. رفتار دقیقاً همانی است که قبلاً در همان Route
 * بود؛ فقط خطاها به‌جای `apiError` مستقیم، با `OrderCreationError`
 * (شامل `status`) Throw می‌شوند تا هر دو Route بتوانند خودشان
 * تبدیلش کنند.
 */
export async function createOrder(params: CreateOrderParams) {
  const {
    customerId,
    items,
    shippingAddress,
    shippingCost,
    paymentMethod,
    prepaymentPercent,
    couponCode,
    notes,
    actorId,
  } = params;

  const customer = await User.findById(customerId);
  if (!customer) {
    throw new OrderCreationError("مشتری یافت نشد", 400);
  }

  // Resolve every line item against the real, current product/variant
  // data — never trust a client-submitted price. This is also where
  // the price/attributes snapshot for the order is taken.
  const orderItems = [];
  for (const item of items) {
    const product = await Product.findById(item.productId);
    if (!product) {
      throw new OrderCreationError(`محصول با شناسه ${item.productId} یافت نشد`, 400);
    }
    const variant = product.variants.find((v) => v._id.toString() === item.variantId);
    if (!variant) {
      throw new OrderCreationError(`Variant انتخاب‌شده برای «${product.title}» یافت نشد`, 400);
    }
    if (!variant.isActive) {
      throw new OrderCreationError(`Variant انتخاب‌شده برای «${product.title}» غیرفعال است`, 400);
    }
    if (variant.stock < item.quantity) {
      throw new OrderCreationError(
        `موجودی «${product.title}» کافی نیست (موجودی: ${variant.stock})`,
        400,
      );
    }

    const unitPrice = computeFinalPrice(variant.price, variant.discountPercent, variant.discountAmount);

    orderItems.push({
      product: product._id,
      variantId: variant._id,
      title: product.title,
      unit: variant.unit,
      colorName: null,
      attributes: variant.attributes ?? [],
      unitPrice,
      quantity: item.quantity,
      lineTotal: unitPrice * item.quantity,
    });
  }

  const subtotal = orderItems.reduce((sum, i) => sum + i.lineTotal, 0);

  // Discount resolution (§41/§42): a Coupon, if provided and valid,
  // takes precedence over the automatic Payment Reward — never both.
  let couponDoc: CouponDocument | null = null;
  if (couponCode) {
    couponDoc = await Coupon.findOne({ code: couponCode.trim().toUpperCase() });
    if (!couponDoc) {
      throw new OrderCreationError("کد تخفیف یافت نشد", 422);
    }
    const usedByUserCount = await CouponRedemption.countDocuments({
      coupon: couponDoc._id,
      user: customer._id,
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
      userId: String(customer._id),
      eligibleAmount: subtotal,
      usedByUserCount,
    });
    if (!eligibility.valid) {
      throw new OrderCreationError(eligibility.reason, 422);
    }
  }

  const rewardSettings = await getDiscountSettings();
  const resolvedDiscount = resolveOrderDiscount({
    eligibleAmount: subtotal,
    paymentMethod,
    appliedCoupon: couponDoc
      ? {
          id: String(couponDoc._id),
          code: couponDoc.code,
          discountPercentage: couponDoc.discountPercentage,
          maxDiscountAmount: couponDoc.maxDiscountAmount,
        }
      : null,
    rewardSettings,
  });

  const totalAmount = Math.max(0, subtotal + shippingCost - resolvedDiscount.amount);
  const {
    prepaymentAmount,
    remainingAmount,
    prepaymentPercent: resolvedPercent,
  } = computePrepayment(paymentMethod, totalAmount, prepaymentPercent);

  const orderNumber = ORDER_NUMBER_OFFSET + (await getNextSequence("orderNumber"));

  // Reserve the coupon's usage slot (atomic — see §28) before any
  // mutation happens, so a lost race never leaves stock decremented
  // for an order that's about to be rejected.
  if (couponDoc) {
    try {
      await reserveCouponUsage(String(couponDoc._id));
    } catch (error) {
      if (error instanceof CouponRedemptionError) {
        throw new OrderCreationError(error.message, 409);
      }
      throw error;
    }
  }

  // Decrement stock for each variant sold.
  for (const item of items) {
    await Product.updateOne(
      { _id: item.productId, "variants._id": item.variantId },
      { $inc: { "variants.$.stock": -item.quantity } },
    );
  }

  let order;
  try {
    order = await Order.create({
      orderNumber,
      customer: customer._id,
      items: orderItems,
      shippingAddress,
      subtotal,
      shippingCost,
      discount:
        resolvedDiscount.source !== null
          ? {
              source: resolvedDiscount.source,
              amount: resolvedDiscount.amount,
              discountPercentage: resolvedDiscount.discountPercentage ?? 0,
              coupon: resolvedDiscount.couponId ?? null,
              couponCode: resolvedDiscount.couponCode ?? null,
              rewardType: resolvedDiscount.rewardType ?? null,
            }
          : null,
      totalAmount,
      paymentMethod,
      prepaymentPercent: resolvedPercent,
      prepaymentAmount,
      remainingAmount,
      notes,
      statusHistory: [
        {
          status: "pending",
          changedAt: new Date(),
          changedBy: actorId,
          note: "",
        },
      ],
    });
  } catch (error) {
    // Compensate the coupon reservation — a failed order must never
    // permanently burn a limited-use coupon slot.
    if (couponDoc) {
      await releaseCouponReservation(String(couponDoc._id)).catch(() => undefined);
    }
    throw error;
  }

  if (couponDoc) {
    try {
      await recordCouponRedemption({
        couponId: String(couponDoc._id),
        userId: String(customer._id),
        orderId: order.id,
        discountAmount: resolvedDiscount.amount,
      });
    } catch (error) {
      // Best-effort audit row — the order and the usage-count reservation
      // already succeeded, so a failure here shouldn't fail the request.
      console.error("Failed to record coupon redemption:", error);
    }
  }

  // یادداشت: پیامک تأیید ثبت سفارش قبلاً اینجا به‌صورت خودکار ارسال
  // می‌شد. طبق درخواست کارفرما، ارسال خودکار پیامک وضعیت (چه در ثبت
  // سفارش و چه در تغییر وضعیت) حذف شد؛ ارسال اکنون فقط با دکمهٔ
  // دستی «ارسال وضعیت به مشتری» در صفحهٔ جزئیات سفارش انجام می‌شود.

  return { order, customer: customer as UserDocument, resolvedDiscount };
}
