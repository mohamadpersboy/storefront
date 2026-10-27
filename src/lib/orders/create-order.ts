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
import { processReferralEventsAfterOrder } from "@/lib/referrals/process-referral-events";
import { notifyOrderCreated } from "@/lib/notifications/events";
import {
  reserveCouponUsage,
  releaseCouponReservation,
  reserveCouponUserUsage,
  releaseCouponUserUsage,
  recordCouponRedemption,
  CouponRedemptionError,
} from "@/lib/discounts/redeem-coupon";
import { reserveStock, releaseStock, StockReservationError } from "@/lib/orders/reserve-stock";

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
  let couponUsedByUserCount = 0;
  if (couponCode) {
    couponDoc = await Coupon.findOne({ code: couponCode.trim().toUpperCase() });
    if (!couponDoc) {
      throw new OrderCreationError("کد تخفیف یافت نشد", 422);
    }
    const usedByUserCount = await CouponRedemption.countDocuments({
      coupon: couponDoc._id,
      user: customer._id,
    });
    couponUsedByUserCount = usedByUserCount;
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

  // Reserve (all atomic, in this order) before the order exists, and
  // compensate in reverse on any failure so a rejected/failed order never
  // burns a coupon slot or leaves stock decremented:
  //   1) global coupon slot (usageLimit)  2) per-user coupon slot
  //   (perUserLimit)  3) stock.
  let couponReserved = false;
  let userUsageReserved = false;
  const releaseReservations = async (stockReserved: boolean) => {
    if (stockReserved) await releaseStock(stockLines);
    if (couponDoc && userUsageReserved) {
      await releaseCouponUserUsage({
        couponId: String(couponDoc._id),
        userId: String(customer._id),
        perUserLimit: couponDoc.perUserLimit,
      }).catch(() => undefined);
    }
    if (couponDoc && couponReserved) {
      await releaseCouponReservation(String(couponDoc._id)).catch(() => undefined);
    }
  };
  const stockLines = orderItems.map((i) => ({
    product: i.product,
    variantId: i.variantId,
    title: i.title,
    quantity: i.quantity,
  }));

  if (couponDoc) {
    try {
      await reserveCouponUsage(String(couponDoc._id));
      couponReserved = true;
      await reserveCouponUserUsage({
        couponId: String(couponDoc._id),
        userId: String(customer._id),
        perUserLimit: couponDoc.perUserLimit,
        usedBefore: couponUsedByUserCount,
      });
      userUsageReserved = couponDoc.perUserLimit !== null;
    } catch (error) {
      await releaseReservations(false);
      if (error instanceof CouponRedemptionError) {
        throw new OrderCreationError(error.message, 409);
      }
      throw error;
    }
  }

  // Atomic conditional stock decrement (`stock >= quantity` inside the
  // same update) — never oversells under concurrent orders.
  try {
    await reserveStock(stockLines);
  } catch (error) {
    await releaseReservations(false);
    if (error instanceof StockReservationError) {
      throw new OrderCreationError(error.message, 409);
    }
    throw error;
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
    // Compensate everything reserved above — a failed order must never
    // permanently burn a coupon slot or leave stock decremented.
    await releaseReservations(true);
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

  try {
    await processReferralEventsAfterOrder(customer, subtotal);
  } catch (error) {
    // Best-effort — دقیقاً هم‌الگو با ثبت Coupon Redemption بالا: سفارش
    // که تازه با موفقیت ثبت شده هرگز نباید به‌خاطر این مرحله Fail شود.
    console.error("Failed to process referral events:", error);
  }

  // اعلان درون‌برنامه‌ای «سفارش ثبت شد» — Best-effort و بعد از موفقیت
  // کامل سفارش؛ شکست آن هرگز سفارش ثبت‌شده را Fail/Rollback نمی‌کند.
  await notifyOrderCreated({
    orderId: order.id,
    orderNumber: order.orderNumber,
    customerId: customer._id,
  });

  return { order, customer: customer as UserDocument, resolvedDiscount };
}
