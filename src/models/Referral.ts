import mongoose, { Schema, type Model, type HydratedDocument, type Types } from "mongoose";

export type ReferralStatus = "pending" | "rewarded" | "ineligible";

/**
 * یک رکورد به‌ازای هر «دعوت‌شده» — نه یک فیلد آرایه روی `User`، تا
 * وضعیت هر دعوت (در انتظار خرید / پاداش داده‌شده / واجد شرایط نبود)
 * و کد پاداش صادرشده جداگانه قابل ردیابی و گزارش‌گیری باشد؛ هم‌الگو
 * با تصمیم مشابه `CouponRedemption` (رکورد جدا به‌ازای هر مصرف، نه
 * شمارنده‌ای روی خود Coupon).
 *
 * هر کاربر حداکثر یک‌بار می‌تواند «دعوت‌شده» باشد (Index یکتا روی
 * `invitee`) — معرف او همیشه همان اولین کد رفرالی است که در ثبت‌نام
 * استفاده کرده.
 */
export interface IReferral {
  referrer: Types.ObjectId; // ref User — دعوت‌کننده
  invitee: Types.ObjectId; // ref User — دعوت‌شده
  code: string; // Snapshot کد رفرال در لحظه ثبت‌نام (اگر بعداً چیزی تغییر کند، تاریخچه درست بماند)
  status: ReferralStatus;
  /**
   * مبلغ (Subtotal) اولین سفارش دعوت‌شده — فقط وقتی آن سفارش ثبت
   * شود پر می‌شود؛ `null` یعنی دعوت‌شده هنوز هیچ سفارشی ثبت نکرده.
   */
  firstOrderAmount: number | null;
  /** کد تخفیفی که به‌عنوان پاداش برای دعوت‌کننده صادر شده (فقط اگر status === "rewarded"). */
  rewardCoupon: Types.ObjectId | null; // ref Coupon
  rewardedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export type ReferralDocument = HydratedDocument<IReferral>;

const ReferralSchema = new Schema<IReferral>(
  {
    referrer: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    invitee: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    code: { type: String, required: true, uppercase: true, trim: true },
    status: {
      type: String,
      enum: ["pending", "rewarded", "ineligible"],
      default: "pending",
      index: true,
    },
    firstOrderAmount: { type: Number, default: null, min: 0 },
    rewardCoupon: { type: Schema.Types.ObjectId, ref: "Coupon", default: null },
    rewardedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

type ReferralModel = Model<IReferral>;

export const Referral: ReferralModel =
  (mongoose.models.Referral as ReferralModel) ||
  mongoose.model<IReferral, ReferralModel>("Referral", ReferralSchema);
