import mongoose, { Schema, type Model, type HydratedDocument } from "mongoose";

/**
 * برند محصول — یک Entity کاملاً مستقل از `Category` (نه یک Variant،
 * نه زیرمجموعه دسته‌بندی). طبق درخواست صریح کارفرما، در فرم محصول
 * جدا از دسته‌بندی انتخاب می‌شود (نگاه کنید `Product.brand`).
 *
 * ساختار هم‌الگو با `Banner` است (لیست ساده با Toggle فعال/غیرفعال
 * + `sortOrder` برای جابه‌جایی دستی، بدون DELETE سخت در UI پیش‌فرض
 * — هرچند Route DELETE هم برای مدیریت کامل در Dashboard موجود
 * است)، به‌همراه فیلدهای تصویر مربعی + Mesh Blur هم‌الگو با تصویر
 * دسته‌بندی سطح اول (`Category.imageUrl`/`imagePublicId`/
 * `imageBlurDataUrl`).
 */
export interface IBrand {
  name: string;
  slug: string;
  imageUrl: string | null;
  imagePublicId: string | null;
  imageBlurDataUrl: string | null;
  isActive: boolean;
  showOnHomepage: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export type BrandDocument = HydratedDocument<IBrand>;

const BrandSchema = new Schema<IBrand>(
  {
    name: { type: String, required: true, trim: true, minlength: 2 },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: /^[a-z0-9-]+$/,
    },
    imageUrl: { type: String, default: null },
    imagePublicId: { type: String, default: null },
    imageBlurDataUrl: { type: String, default: null },
    isActive: { type: Boolean, default: true },
    showOnHomepage: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true },
);

type BrandModel = Model<IBrand>;

export const Brand: BrandModel =
  (mongoose.models.Brand as BrandModel) ||
  mongoose.model<IBrand, BrandModel>("Brand", BrandSchema);
