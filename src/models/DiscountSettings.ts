import mongoose, { Schema, type Model } from "mongoose";

const SINGLETON_ID = "discount-settings";

export interface IDiscountSettings {
  _id: string;
  onlinePaymentRewardEnabled: boolean;
  onlinePaymentRewardPercentage: number;
  mixedPaymentRewardEnabled: boolean;
  mixedPaymentRewardPercentage: number;
  updatedAt: Date;
}

const DiscountSettingsSchema = new Schema<IDiscountSettings>(
  {
    _id: { type: String, default: SINGLETON_ID },
    onlinePaymentRewardEnabled: { type: Boolean, default: false },
    onlinePaymentRewardPercentage: { type: Number, default: 0, min: 0, max: 100 },
    mixedPaymentRewardEnabled: { type: Boolean, default: false },
    mixedPaymentRewardPercentage: { type: Number, default: 0, min: 0, max: 100 },
  },
  { timestamps: { createdAt: false, updatedAt: true } },
);

type DiscountSettingsModel = Model<IDiscountSettings>;

export const DiscountSettings: DiscountSettingsModel =
  (mongoose.models.DiscountSettings as DiscountSettingsModel) ||
  mongoose.model<IDiscountSettings, DiscountSettingsModel>(
    "DiscountSettings",
    DiscountSettingsSchema,
  );

/**
 * Returns the single settings document, creating it with safe
 * (fully-disabled) defaults on first read. Using findOneAndUpdate +
 * upsert here — instead of "find, and if null create" — makes first
 * access atomic, so two concurrent requests can't both try to create it.
 */
export async function getDiscountSettings() {
  return DiscountSettings.findOneAndUpdate(
    { _id: SINGLETON_ID },
    { $setOnInsert: { _id: SINGLETON_ID } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
}
