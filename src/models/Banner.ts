import mongoose, { Schema, type Model, type HydratedDocument } from "mongoose";

/**
 * بنرهای Hero Slider صفحه اصلی Storefront (Settings → اسلایدر).
 * هم‌الگو با `Bank` (لیست ساده با Toggle فعال/غیرفعال، بدون DELETE
 * سخت — طبق هماهنگی با معماری موجود پروژه؛ نگاه کنید بند مهم پروژه:
 * از ایجاد Duplicate Model/Pattern خودداری و با معماری فعلی هماهنگ
 * باش).
 *
 * `imageBlurDataUrl`: یک تصویر بسیار کوچک/تار (Base64، چند صد بایت)
 * که هنگام آپلود از همان تصویر اصلی تولید می‌شود و به‌عنوان
 * Placeholder محو (Mesh Blur) قبل از Load شدن تصویر اصلی در
 * Storefront استفاده می‌شود — طبق بند ۲۷-۳۰ Master Workflow
 * (Image Loading — Mesh Blur اجباری).
 */
export interface IBanner {
  title: string;
  subtitle: string | null;
  ctaLabel: string | null;
  href: string;
  imageUrl: string;
  imagePublicId: string;
  imageBlurDataUrl: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export type BannerDocument = HydratedDocument<IBanner>;

const BannerSchema = new Schema<IBanner>(
  {
    title: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    subtitle: { type: String, trim: true, maxlength: 160, default: null },
    ctaLabel: { type: String, trim: true, maxlength: 30, default: null },
    href: { type: String, required: true, trim: true },
    imageUrl: { type: String, required: true },
    imagePublicId: { type: String, required: true },
    imageBlurDataUrl: { type: String, default: null },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true },
);

type BannerModel = Model<IBanner>;

export const Banner: BannerModel =
  (mongoose.models.Banner as BannerModel) ||
  mongoose.model<IBanner, BannerModel>("Banner", BannerSchema);
