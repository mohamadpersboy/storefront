import { Coupon, type CouponDocument } from "@/models/Coupon";
import { CouponRedemption } from "@/models/CouponRedemption";

export class CouponRedemptionError extends Error {}

/**
 * Atomically reserves one usage slot on a coupon (§28 — concurrent
 * requests must never be able to push usedCount past usageLimit). A
 * single `findOneAndUpdate` with the limit baked into the filter is
 * what makes this safe: MongoDB only lets one caller's update match
 * and succeed once `usedCount` reaches the limit, so a second
 * simultaneous caller simply gets `null` back instead of also
 * succeeding.
 *
 * This only reserves the slot — it does not create the
 * CouponRedemption row, since that needs an Order id that doesn't
 * exist yet. Callers must follow up with `recordCouponRedemption`
 * once the order is created, and call `releaseCouponReservation` to
 * compensate if order creation fails afterwards.
 */
export async function reserveCouponUsage(couponId: string): Promise<CouponDocument> {
  const coupon = await Coupon.findOneAndUpdate(
    {
      _id: couponId,
      status: "active",
      $or: [{ usageLimit: null }, { $expr: { $lt: ["$usedCount", "$usageLimit"] } }],
    },
    { $inc: { usedCount: 1 } },
    { new: true },
  );

  if (!coupon) {
    throw new CouponRedemptionError("ظرفیت استفاده از این کد تخفیف تمام شده است");
  }

  return coupon;
}

export async function releaseCouponReservation(couponId: string): Promise<void> {
  await Coupon.updateOne({ _id: couponId }, { $inc: { usedCount: -1 } });
}

export async function recordCouponRedemption(params: {
  couponId: string;
  userId: string;
  orderId: string;
  discountAmount: number;
}): Promise<void> {
  await CouponRedemption.create({
    coupon: params.couponId,
    user: params.userId,
    order: params.orderId,
    discountAmount: params.discountAmount,
  });
}
