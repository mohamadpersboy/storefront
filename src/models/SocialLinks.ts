import mongoose, { Schema, type Model } from "mongoose";

const SINGLETON_ID = "social-links";

/**
 * فهرست شبکه‌های اجتماعی پشتیبانی‌شده. برای افزودن شبکه جدید در آینده،
 * فقط کافی است یک مقدار به این آرایه اضافه شود — هیچ تغییر دیگری در
 * Model/Route/UI لازم نیست (طرح‌شده طبق درخواست صریح کارفرما).
 */
export const SOCIAL_PLATFORMS = [
  "instagram",
  "telegram",
  "whatsapp",
  "rubika",
  "eitaa",
] as const;

export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];

export interface ISocialLink {
  platform: SocialPlatform;
  url: string;
  isActive: boolean;
}

export interface ISocialLinks {
  _id: string;
  links: ISocialLink[];
  updatedAt: Date;
}

const SocialLinkSchema = new Schema<ISocialLink>(
  {
    platform: { type: String, enum: SOCIAL_PLATFORMS, required: true },
    url: { type: String, default: "", trim: true },
    isActive: { type: Boolean, default: false },
  },
  { _id: false },
);

const defaultLinks = (): ISocialLink[] =>
  SOCIAL_PLATFORMS.map((platform) => ({ platform, url: "", isActive: false }));

const SocialLinksSchema = new Schema<ISocialLinks>(
  {
    _id: { type: String, default: SINGLETON_ID },
    links: { type: [SocialLinkSchema], default: defaultLinks },
  },
  { timestamps: { createdAt: false, updatedAt: true } },
);

type SocialLinksModel = Model<ISocialLinks>;

export const SocialLinks: SocialLinksModel =
  (mongoose.models.SocialLinks as SocialLinksModel) ||
  mongoose.model<ISocialLinks, SocialLinksModel>("SocialLinks", SocialLinksSchema);

/**
 * سند تکی تنظیمات را برمی‌گرداند؛ در اولین دسترسی با مقادیر پیش‌فرض
 * (همه غیرفعال) به‌صورت Atomic ساخته می‌شود — الگوی مشابه
 * `getDiscountSettings()` تا دو درخواست همزمان اول هرگز دو سند نسازند.
 */
export async function getSocialLinks() {
  const doc = await SocialLinks.findOneAndUpdate(
    { _id: SINGLETON_ID },
    { $setOnInsert: { _id: SINGLETON_ID, links: defaultLinks() } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  // اگر بعداً یک پلتفرم جدید به SOCIAL_PLATFORMS اضافه شود، سندهای قدیمی
  // آن را در آرایه ندارند — این‌جا با مقدار پیش‌فرض تکمیل می‌شود تا
  // Migration دستی لازم نباشد.
  const existingPlatforms = new Set(doc.links.map((l) => l.platform));
  const missing = SOCIAL_PLATFORMS.filter((p) => !existingPlatforms.has(p));
  if (missing.length > 0) {
    doc.links.push(...missing.map((platform) => ({ platform, url: "", isActive: false })));
    await doc.save();
  }

  return doc;
}
