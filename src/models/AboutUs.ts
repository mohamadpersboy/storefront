import mongoose, { Schema, type Model } from "mongoose";

const SINGLETON_ID = "about-us";

export interface IAboutUs {
  _id: string;
  title: string;
  content: string;
  imageUrl: string;
  updatedAt: Date;
}

const AboutUsSchema = new Schema<IAboutUs>(
  {
    _id: { type: String, default: SINGLETON_ID },
    title: { type: String, default: "درباره فرش سقطچی", trim: true },
    content: { type: String, default: "", trim: true },
    imageUrl: { type: String, default: "", trim: true },
  },
  { timestamps: { createdAt: false, updatedAt: true } },
);

type AboutUsModel = Model<IAboutUs>;

export const AboutUs: AboutUsModel =
  (mongoose.models.AboutUs as AboutUsModel) ||
  mongoose.model<IAboutUs, AboutUsModel>("AboutUs", AboutUsSchema);

/**
 * سند تکی «درباره ما» را برمی‌گرداند؛ در اولین دسترسی به‌صورت Atomic با
 * مقادیر پیش‌فرض ساخته می‌شود — الگوی مشابه `getSocialLinks()`.
 */
export async function getAboutUs() {
  return AboutUs.findOneAndUpdate(
    { _id: SINGLETON_ID },
    { $setOnInsert: { _id: SINGLETON_ID } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
}
