import mongoose, { Schema, type Model } from "mongoose";

const SINGLETON_ID = "contact-us";

export interface IContactUs {
  _id: string;
  phone: string;
  secondaryPhone: string;
  email: string;
  address: string;
  workingHours: string;
  latitude: number | null;
  longitude: number | null;
  /** لینک مستقیم چت با ادمین پشتیبانی (مثلاً t.me/username یا wa.me/...) */
  supportAdminLink: string;
  telegramLink: string;
  whatsappLink: string;
  rubikaLink: string;
  eitaaLink: string;
  updatedAt: Date;
}

const ContactUsSchema = new Schema<IContactUs>(
  {
    _id: { type: String, default: SINGLETON_ID },
    phone: { type: String, default: "", trim: true },
    secondaryPhone: { type: String, default: "", trim: true },
    email: { type: String, default: "", trim: true },
    address: { type: String, default: "", trim: true },
    workingHours: { type: String, default: "", trim: true },
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
    supportAdminLink: { type: String, default: "", trim: true },
    telegramLink: { type: String, default: "", trim: true },
    whatsappLink: { type: String, default: "", trim: true },
    rubikaLink: { type: String, default: "", trim: true },
    eitaaLink: { type: String, default: "", trim: true },
  },
  { timestamps: { createdAt: false, updatedAt: true } },
);

type ContactUsModel = Model<IContactUs>;

export const ContactUs: ContactUsModel =
  (mongoose.models.ContactUs as ContactUsModel) ||
  mongoose.model<IContactUs, ContactUsModel>("ContactUs", ContactUsSchema);

/**
 * سند تکی «تماس با ما» را برمی‌گرداند؛ در اولین دسترسی به‌صورت Atomic با
 * مقادیر پیش‌فرض ساخته می‌شود — الگوی مشابه `getSocialLinks()`.
 */
export async function getContactUs() {
  return ContactUs.findOneAndUpdate(
    { _id: SINGLETON_ID },
    { $setOnInsert: { _id: SINGLETON_ID } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
}
