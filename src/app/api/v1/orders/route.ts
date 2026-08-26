import type { NextRequest } from "next/server";
import type { Types } from "mongoose";
import { connectToDatabase } from "@/lib/db/connect";
import { Order, type IOrder } from "@/models/Order";
import { Product } from "@/models/Product";
import { User } from "@/models/User";
import { Coupon, type CouponDocument } from "@/models/Coupon";
import { CouponRedemption } from "@/models/CouponRedemption";
import { getDiscountSettings } from "@/models/DiscountSettings";
import { getNextSequence } from "@/models/Counter";
import { PERMISSIONS } from "@/lib/constants/rbac";
import { requireApiUser } from "@/lib/auth/api-guard";
import { apiError, apiSuccess } from "@/lib/utils/api-response";
import { computeFinalPrice, computePrepayment } from "@/lib/utils/pricing";
import { createOrderSchema, ordersListQuerySchema } from "@/lib/validations/orders";
import { sendOrderStatusSms } from "@/lib/sms/send-order-status-sms";
import { resolveOrderDiscount } from "@/lib/discounts/engine";
import { validateCouponEligibility } from "@/lib/discounts/validate-coupon";
import {
  reserveCouponUsage,
  releaseCouponReservation,
  recordCouponRedemption,
  CouponRedemptionError,
} from "@/lib/discounts/redeem-coupon";

const ORDER_NUMBER_OFFSET = 10_000;

type LeanOrder = IOrder & {
  _id: Types.ObjectId;
  customer: { _id: Types.ObjectId; fullName?: string; phoneNumber: string } | Types.ObjectId;
};

export async function GET(request: NextRequest) {
  const guard = await requireApiUser(PERMISSIONS.ORDERS_READ);
  if (guard.response) return guard.response;

  const { searchParams } = request.nextUrl;
  const parsed = ordersListQuerySchema.safeParse({
    page: searchParams.get("page") ?? undefined,
    limit: searchParams.get("limit") ?? undefined,
    search: searchParams.get("search") ?? undefined,
    status: searchParams.get("status") ?? undefined,
  });

  if (!parsed.success) {
    return apiError("پارامترهای جستجو معتبر نیستند", {
      status: 422,
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  const { page, limit, search, status } = parsed.data;
  await connectToDatabase();

  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;

  if (search) {
    const asNumber = Number(search);
    const matchingCustomers = await User.find({
      $or: [
        { phoneNumber: { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" } },
        { fullName: { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" } },
      ],
    })
      .select("_id")
      .lean();

    filter.$or = [
      ...(Number.isFinite(asNumber) && search.trim() !== ""
        ? [{ orderNumber: asNumber }]
        : []),
      { customer: { $in: matchingCustomers.map((c) => c._id) } },
    ];
  }

  const result = await Order.paginate(filter, {
    page,
    limit,
    sort: { createdAt: -1 },
    populate: { path: "customer", select: "fullName phoneNumber" },
    lean: true,
  });

  return apiSuccess(
    (result.docs as LeanOrder[]).map((o) => ({
      id: String(o._id),
      orderNumber: o.orderNumber,
      customer: o.customer,
      itemsCount: o.items.length,
      totalAmount: o.totalAmount,
      status: o.status,
      createdAt: o.createdAt,
    })),
    {
      pagination: {
        totalDocs: result.totalDocs,
        totalPages: result.totalPages,
        page: result.page ?? page,
        limit: result.limit,
        hasNextPage: result.hasNextPage,
        hasPrevPage: result.hasPrevPage,
      },
    },
  );
}

export async function POST(request: Request) {
  const guard = await requireApiUser(PERMISSIONS.ORDERS_UPDATE);
  if (guard.response) return guard.response;
  const { user: actor } = guard;

  const json = await request.json().catch(() => null);
  const parsed = createOrderSchema.safeParse(json);

  if (!parsed.success) {
    return apiError("اطلاعات ارسالی معتبر نیست", {
      status: 422,
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  const { customerId, items, shippingAddress, shippingCost, paymentMethod, prepaymentPercent, couponCode, notes } =
    parsed.data;

  await connectToDatabase();

  const customer = await User.findById(customerId);
  if (!customer) {
    return apiError("مشتری یافت نشد", { status: 400 });
  }

  // Resolve every line item against the real, current product/variant
  // data — never trust a client-submitted price. This is also where
  // the price/attributes snapshot for the order is taken.
  const orderItems = [];
  for (const item of items) {
    const product = await Product.findById(item.productId);
    if (!product) {
      return apiError(`محصول با شناسه ${item.productId} یافت نشد`, { status: 400 });
    }
    const variant = product.variants.find(
      (v) => v._id.toString() === item.variantId,
    );
    if (!variant) {
      return apiError(`Variant انتخاب‌شده برای «${product.title}» یافت نشد`, {
        status: 400,
      });
    }
    if (!variant.isActive) {
      return apiError(`Variant انتخاب‌شده برای «${product.title}» غیرفعال است`, {
        status: 400,
      });
    }
    if (variant.stock < item.quantity) {
      return apiError(
        `موجودی «${product.title}» کافی نیست (موجودی: ${variant.stock})`,
        { status: 400 },
      );
    }

    const unitPrice = computeFinalPrice(
      variant.price,
      variant.discountPercent,
      variant.discountAmount,
    );

    orderItems.push({
      product: product._id,
      variantId: variant._id,
      title: product.title,
      unit: variant.unit,
      colorName: null, // resolved client-side for display; not critical to persist name if colorId ever changes
      attributes: variant.attributes,
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
      return apiError("کد تخفیف یافت نشد", { status: 422 });
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
      return apiError(eligibility.reason, { status: 422 });
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
  const { prepaymentAmount, remainingAmount, prepaymentPercent: resolvedPercent } =
    computePrepayment(paymentMethod, totalAmount, prepaymentPercent);

  const orderNumber = ORDER_NUMBER_OFFSET + (await getNextSequence("orderNumber"));

  // Reserve the coupon's usage slot (atomic — see §28) before any
  // mutation happens, so a lost race never leaves stock decremented
  // for an order that's about to be rejected.
  if (couponDoc) {
    try {
      await reserveCouponUsage(String(couponDoc._id));
    } catch (error) {
      if (error instanceof CouponRedemptionError) {
        return apiError(error.message, { status: 409 });
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
          changedBy: actor._id,
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

  // Best-effort order-confirmation SMS — must never fail order creation.
  try {
    await sendOrderStatusSms(customer.phoneNumber, order.orderNumber, "pending");
  } catch (error) {
    console.error("Failed to send order confirmation SMS:", error);
  }

  return apiSuccess(
    { id: order.id, orderNumber: order.orderNumber },
    { message: "سفارش با موفقیت ثبت شد", status: 201 },
  );
}
