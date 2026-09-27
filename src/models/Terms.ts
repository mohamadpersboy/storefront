import mongoose, { Schema, type Model } from "mongoose";

const SINGLETON_ID = "terms";

export interface ITerms {
  _id: string;
  title: string;
  content: string;
  updatedAt: Date;
}

const TermsSchema = new Schema<ITerms>(
  {
    _id: { type: String, default: SINGLETON_ID },
    title: { type: String, default: "قوانین و مقررات", trim: true },
    content: { type: String, default: "", trim: true },
  },
  { timestamps: { createdAt: false, updatedAt: true } },
);

type TermsModel = Model<ITerms>;

export const Terms: TermsModel =
  (mongoose.models.Terms as TermsModel) ||
  mongoose.model<ITerms, TermsModel>("Terms", TermsSchema);

/**
 * سند تکی «قوانین و مقررات» را برمی‌گرداند؛ در اولین دسترسی
 * به‌صورت Atomic با مقادیر پیش‌فرض ساخته می‌شود — دقیقاً همان الگوی
 * `getAboutUs()`/`getContactUs()`/`getSocialLinks()`.
 */
export async function getTerms() {
  return Terms.findOneAndUpdate(
    { _id: SINGLETON_ID },
    { $setOnInsert: { _id: SINGLETON_ID } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
}
