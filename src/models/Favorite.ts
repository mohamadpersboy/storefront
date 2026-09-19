import mongoose, { Schema, type Model, type HydratedDocument, type Types } from "mongoose";

/**
 * علاقه‌مندی‌ها (Watchlist) — یک ردیف به‌ازای هر (کاربر، محصول).
 *
 * طبق یادداشت از قبل مستند در CLAUDE.md (بخش In Progress، «نکته
 * معماری مهم کشف‌شده حین بررسی»): این مدل جزو زیرساخت مورد انتظار
 * خودِ کار Storefront است، نه یک تصمیم معماری جداگانه که نیاز به
 * اجازه اضافه داشته باشد.
 *
 * فقط کاربران Login‌شده — هم‌الگو با `Cart` (نگاه کنید توضیح
 * `requireAuthenticatedUser`؛ Favorite هم مثل Cart متعلق به خود
 * کاربر است، نه یک منبع مدیریتی Dashboard).
 */
export interface IFavorite {
  user: Types.ObjectId;
  product: Types.ObjectId;
  createdAt: Date;
}

export type FavoriteDocument = HydratedDocument<IFavorite>;

const FavoriteSchema = new Schema<IFavorite>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

// یک محصول نمی‌تواند دوبار برای یک کاربر علاقه‌مندی ثبت شود.
FavoriteSchema.index({ user: 1, product: 1 }, { unique: true });

type FavoriteModel = Model<IFavorite>;

export const Favorite: FavoriteModel =
  (mongoose.models.Favorite as FavoriteModel) ||
  mongoose.model<IFavorite, FavoriteModel>("Favorite", FavoriteSchema);
