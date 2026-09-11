import mongoose, { Schema, type Model } from "mongoose";

const SINGLETON_ID = "shipping-settings";

/**
 * تنظیمات ارسال فروشگاه — Singleton، هم‌الگو با `DiscountSettings`.
 * فعلاً فقط آستانه ارسال رایگان؛ در آینده می‌تواند هزینه پایه ارسال،
 * محدوده جغرافیایی و... را هم در بر بگیرد.
 *
 * `freeShippingEnabled` عمداً پیش‌فرض `false` است — تا کارفرما
 * خودش صریحاً این قابلیت را با یک مبلغ واقعی فعال نکند، Storefront
 * هرگز ادعای «ارسال رایگان» نمی‌کند (نه یک وعده ساختگی که کسی
 * تصمیمش را نگرفته).
 */
export interface IShippingSettings {
  _id: string;
  freeShippingEnabled: boolean;
  freeShippingThreshold: number;
  updatedAt: Date;
}

const ShippingSettingsSchema = new Schema<IShippingSettings>(
  {
    _id: { type: String, default: SINGLETON_ID },
    freeShippingEnabled: { type: Boolean, default: false },
    freeShippingThreshold: { type: Number, default: 500000, min: 0 },
  },
  { timestamps: { createdAt: false, updatedAt: true } },
);

type ShippingSettingsModel = Model<IShippingSettings>;

export const ShippingSettings: ShippingSettingsModel =
  (mongoose.models.ShippingSettings as ShippingSettingsModel) ||
  mongoose.model<IShippingSettings, ShippingSettingsModel>(
    "ShippingSettings",
    ShippingSettingsSchema,
  );

/**
 * Returns the single settings document, creating it with safe
 * (disabled) defaults on first read — findOneAndUpdate + upsert makes
 * first access atomic (هم‌الگو با `getDiscountSettings`).
 */
export async function getShippingSettings() {
  return ShippingSettings.findOneAndUpdate(
    { _id: SINGLETON_ID },
    { $setOnInsert: { _id: SINGLETON_ID } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
}
