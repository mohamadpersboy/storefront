import mongoose, { Schema, type Model, type Types } from "mongoose";

/**
 * One row per successful coupon redemption. Two things rely on this
 * collection existing separately from Coupon.usedCount:
 *  - Per-user limits (§28) need to count *this specific user's* past
 *    redemptions, which a single counter on Coupon can't answer.
 *  - The unique index on `order` guarantees an order can never end up
 *    with two redemption rows (e.g. a retried request), independent of
 *    whatever Order.discount snapshot says.
 */
export interface ICouponRedemption {
  coupon: Types.ObjectId;
  user: Types.ObjectId;
  order: Types.ObjectId;
  discountAmount: number;
  createdAt: Date;
}

const CouponRedemptionSchema = new Schema<ICouponRedemption>({
  coupon: { type: Schema.Types.ObjectId, ref: "Coupon", required: true, index: true },
  user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  order: { type: Schema.Types.ObjectId, ref: "Order", required: true, unique: true },
  discountAmount: { type: Number, required: true, min: 0 },
  createdAt: { type: Date, default: Date.now },
});

type CouponRedemptionModel = Model<ICouponRedemption>;

export const CouponRedemption: CouponRedemptionModel =
  (mongoose.models.CouponRedemption as CouponRedemptionModel) ||
  mongoose.model<ICouponRedemption, CouponRedemptionModel>(
    "CouponRedemption",
    CouponRedemptionSchema,
  );
