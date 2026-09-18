import mongoose, { Schema, type Model } from "mongoose";

const SINGLETON_ID = "referral-settings";

/**
 * تنظیمات سیستم «دعوت دوستان» — Singleton، هم‌الگو با
 * `DiscountSettings`/`ShippingSettings`. هر سه پارامتری که کارفرما
 * صریحاً گفت باید از Dashboard قابل تنظیم باشد اینجاست: سقف تعداد
 * دعوت هر نفر، درصد/سقف پاداش، و حداقل مبلغ اولین خرید دعوت‌شده.
 *
 * `enabled` عمداً پیش‌فرض `false` است — دقیقاً همان اصل
 * `ShippingSettings.freeShippingEnabled`: تا کارفرما خودش صریحاً
 * فعالش نکند، Storefront هرگز وعده «دعوت کن، جایزه بگیر» ساختگی
 * نشان نمی‌دهد.
 */
export interface IReferralSettings {
  _id: string;
  enabled: boolean;
  /** حداکثر تعداد دعوتی که هر کاربر می‌تواند ثبت کند — `null` یعنی نامحدود. */
  maxReferralsPerUser: number | null;
  /** درصد تخفیف کد پاداشی که به دعوت‌کننده داده می‌شود. */
  rewardDiscountPercentage: number;
  /** سقف مبلغ تخفیف کد پاداش — `null` یعنی بدون سقف (هم‌الگو با `Coupon.maxDiscountAmount`). */
  rewardMaxDiscountAmount: number | null;
  /** حداقل مبلغ (Subtotal) اولین سفارش دعوت‌شده تا پاداش صادر شود. */
  minInviteeOrderAmount: number;
  /** مدت اعتبار کد پاداش صادرشده، برحسب روز از لحظه صدور. */
  rewardCouponValidityDays: number;
  updatedAt: Date;
}

const ReferralSettingsSchema = new Schema<IReferralSettings>(
  {
    _id: { type: String, default: SINGLETON_ID },
    enabled: { type: Boolean, default: false },
    maxReferralsPerUser: { type: Number, default: null, min: 1 },
    rewardDiscountPercentage: { type: Number, default: 10, min: 0, max: 100 },
    rewardMaxDiscountAmount: { type: Number, default: null, min: 0 },
    minInviteeOrderAmount: { type: Number, default: 0, min: 0 },
    rewardCouponValidityDays: { type: Number, default: 30, min: 1 },
  },
  { timestamps: { createdAt: false, updatedAt: true } },
);

type ReferralSettingsModel = Model<IReferralSettings>;

export const ReferralSettings: ReferralSettingsModel =
  (mongoose.models.ReferralSettings as ReferralSettingsModel) ||
  mongoose.model<IReferralSettings, ReferralSettingsModel>(
    "ReferralSettings",
    ReferralSettingsSchema,
  );

/** هم‌الگو با `getShippingSettings` — upsert Atomic، پیش‌فرض غیرفعال. */
export async function getReferralSettings() {
  return ReferralSettings.findOneAndUpdate(
    { _id: SINGLETON_ID },
    { $setOnInsert: { _id: SINGLETON_ID } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
}
