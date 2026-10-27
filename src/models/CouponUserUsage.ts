import mongoose, { Schema, type Model, type Types } from "mongoose";

/**
 * شمارنده اتمیک «تعداد استفاده یک کاربر از یک کد تخفیف».
 *
 * چرا جدا از `CouponRedemption`؟ ردیف Redemption بعد از ساخت سفارش ثبت
 * می‌شود؛ پس شمارش آن قبل از ساخت سفارش اتمیک نیست و چند سفارش هم‌زمان
 * یک کاربر هر کدام صفر استفاده می‌بینند. این شمارنده با یک نوشتن شرطی
 * (`count < perUserLimit`) قبل از ساخت سفارش رزرو می‌شود.
 * Unique Index روی `{coupon, user}` ساخت هم‌زمان اولین ردیف را یکتا می‌کند.
 * (Index جدید هنگام Deploy ساخته می‌شود.)
 */
export interface ICouponUserUsage {
  coupon: Types.ObjectId;
  user: Types.ObjectId;
  count: number;
}

const CouponUserUsageSchema = new Schema<ICouponUserUsage>({
  coupon: { type: Schema.Types.ObjectId, ref: "Coupon", required: true },
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  count: { type: Number, required: true, min: 0, default: 0 },
});
CouponUserUsageSchema.index({ coupon: 1, user: 1 }, { unique: true });

type CouponUserUsageModel = Model<ICouponUserUsage>;

export const CouponUserUsage: CouponUserUsageModel =
  (mongoose.models.CouponUserUsage as CouponUserUsageModel) ||
  mongoose.model<ICouponUserUsage, CouponUserUsageModel>("CouponUserUsage", CouponUserUsageSchema);
