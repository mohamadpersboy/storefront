import { Coupon, type CouponDocument } from "@/models/Coupon";
import { CouponRedemption } from "@/models/CouponRedemption";
import { CouponUserUsage } from "@/models/CouponUserUsage";

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
    { returnDocument: "after" },
  );

  if (!coupon) {
    throw new CouponRedemptionError("ظرفیت استفاده از این کد تخفیف تمام شده است");
  }

  return coupon;
}

export async function releaseCouponReservation(couponId: string): Promise<void> {
  await Coupon.updateOne({ _id: couponId }, { $inc: { usedCount: -1 } });
}

/**
 * رزرو اتمیک یک «استفاده» از سقف `perUserLimit` برای یک کاربر (§28).
 * فقط یک نوشتن شرطی (`count < perUserLimit`) برنده می‌شود؛ پس چند سفارش
 * هم‌زمان یک کاربر هرگز از سقف رد نمی‌شوند. اگر `perUserLimit` تعریف
 * نشده باشد، کاری انجام نمی‌شود.
 *
 * `usedBefore` تعداد Redemptionهای ثبت‌شده قبلی است (قبل از وجود این
 * شمارنده)؛ فقط برای مقداردهی اولیه شمارنده‌ی تازه استفاده می‌شود.
 * هر رزرو موفق باید در شکست سفارش با `releaseCouponUserUsage` جبران شود.
 */
export async function reserveCouponUserUsage(params: {
  couponId: string;
  userId: string;
  perUserLimit: number | null;
  usedBefore: number;
}): Promise<void> {
  const { couponId, userId, perUserLimit, usedBefore } = params;
  if (perUserLimit === null) return;
  const limitError = () => new CouponRedemptionError("شما قبلاً از این کد تخفیف استفاده کرده‌اید");

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const bumped = await CouponUserUsage.findOneAndUpdate(
      { coupon: couponId, user: userId, count: { $lt: perUserLimit } },
      { $inc: { count: 1 } },
      { returnDocument: "after" },
    );
    if (bumped) return;

    // یا سقف پر است، یا شمارنده هنوز ساخته نشده.
    if (await CouponUserUsage.exists({ coupon: couponId, user: userId })) throw limitError();
    if (usedBefore >= perUserLimit) throw limitError();
    try {
      await CouponUserUsage.create({ coupon: couponId, user: userId, count: usedBefore + 1 });
      return;
    } catch (error) {
      // درخواست هم‌زمان دیگری شمارنده را ساخت؛ دوباره با نوشتن شرطی تلاش می‌کنیم.
      if ((error as { code?: number })?.code !== 11000) throw error;
    }
  }
  throw limitError();
}

export async function releaseCouponUserUsage(params: {
  couponId: string;
  userId: string;
  perUserLimit: number | null;
}): Promise<void> {
  if (params.perUserLimit === null) return;
  await CouponUserUsage.updateOne(
    { coupon: params.couponId, user: params.userId, count: { $gt: 0 } },
    { $inc: { count: -1 } },
  );
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
