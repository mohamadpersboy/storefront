import mongoose, { Schema, type Model, type HydratedDocument, type Types } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import type { PaginateModel } from "mongoose";
import "mongoose-paginate-v2";

export type ProductStatus = "draft" | "published" | "archived";

export interface IVariantAttribute {
  name: string; // مثلاً "رنگ", "اندازه", "شانه"
  value: string; // مثلاً "قرمز", "6×4 متر", "1200"
}

export interface IProductVariant {
  _id: Types.ObjectId;
  unit: string; // تخته / عدد / جفت / متر / متر مربع
  colorId: Types.ObjectId | null; // حداکثر یک رنگ در هر Variant
  attributes: IVariantAttribute[];
  sku?: string;
  price: number; // قیمت پایه این Variant (تومان)
  discountPercent: number; // 0-100، 0 یعنی بدون تخفیف
  discountAmount: number; // تخفیف مبلغ ثابت (تومان)، 0 یعنی بدون تخفیف
  stock: number;
  isActive: boolean;
  /**
   * اولویت نمایش این Variant — عدد کوچک‌تر یعنی اولویت بیشتر (زودتر
   * به‌عنوان Variant نماینده روی کارت/صفحه محصول انتخاب می‌شود)، دقیقاً
   * هم‌معنا با `Product.sortOrder`/`Category.sortOrder`. Variantهای
   * قدیمی‌تر که این فیلد را ندارند باید همیشه با `?? 0` خوانده شوند
   * (همان درسِ «Mongoose schema defaults don't backfill»).
   */
  sortOrder: number;
}

export interface ITechnicalSpec {
  key: string;
  value: string;
}

export interface IProductImage {
  url: string;
  publicId: string;
}

export interface ISeo {
  title?: string;
  description?: string;
}

export interface IProduct {
  title: string;
  slug: string;
  description?: string;
  technicalDescription?: string;
  technicalSpecifications: ITechnicalSpec[];
  category: Types.ObjectId;
  /**
   * برند — مستقل از دسته‌بندی، اختیاری (نه Variant، نه زیرمجموعه
   * دسته‌بندی). Nullable/Optional چون محصولات موجود قبل از افزودن
   * این فیلد برند ندارند (Additive-only schema change؛ نگاه کنید
   * یادداشت «Mongoose schema defaults don't backfill»).
   */
  brand: Types.ObjectId | null;
  images: IProductImage[];
  variants: IProductVariant[];
  status: ProductStatus;
  /**
   * اولویت نمایش این محصول در ردیف‌های Storefront (جدیدترین‌ها،
   * پرفروش‌ترین‌ها، شگفت‌انگیزها، دسته‌بندی‌ها) — عدد کوچک‌تر یعنی
   * اولویت بیشتر (زودتر نمایش داده می‌شود)، دقیقاً هم‌معنا با
   * `sortOrder` در Category/Banner/Brand. محصولات قدیمی‌تر که این
   * فیلد را ندارند باید همیشه با `?? 0` خوانده شوند، نه با فرض
   * وجود مقدار (همان درسِ «Mongoose schema defaults don't
   * backfill»).
   */
  sortOrder: number;
  seo: ISeo;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export type ProductDocument = HydratedDocument<IProduct>;

const VariantAttributeSchema = new Schema<IVariantAttribute>(
  {
    name: { type: String, required: true, trim: true },
    value: { type: String, required: true, trim: true },
  },
  { _id: false },
);

const ProductVariantSchema = new Schema<IProductVariant>({
  unit: { type: String, required: true, trim: true },
  colorId: {
    type: Schema.Types.ObjectId,
    ref: "Color",
    default: null,
  },
  attributes: { type: [VariantAttributeSchema], default: [] },
  sku: { type: String, trim: true },
  price: { type: Number, required: true, min: 0 },
  discountPercent: { type: Number, default: 0, min: 0, max: 100 },
  discountAmount: { type: Number, default: 0, min: 0 },
  stock: { type: Number, required: true, min: 0, default: 0 },
  isActive: { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 },
});

const TechnicalSpecSchema = new Schema<ITechnicalSpec>(
  {
    key: { type: String, required: true, trim: true },
    value: { type: String, required: true, trim: true },
  },
  { _id: false },
);

const ProductImageSchema = new Schema<IProductImage>(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
  },
  { _id: false },
);

const ProductSchema = new Schema<IProduct>(
  {
    title: { type: String, required: true, trim: true, minlength: 2 },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: /^[a-z0-9-]+$/,
    },
    description: { type: String, trim: true },
    technicalDescription: { type: String, trim: true },
    technicalSpecifications: { type: [TechnicalSpecSchema], default: [] },
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
      index: true,
    },
    brand: {
      type: Schema.Types.ObjectId,
      ref: "Brand",
      default: null,
      index: true,
    },
    images: {
      type: [ProductImageSchema],
      default: [],
      validate: {
        validator: (v: IProductImage[]) => v.length <= 10,
        message: "حداکثر ۱۰ تصویر مجاز است",
      },
    },
    variants: {
      type: [ProductVariantSchema],
      validate: {
        validator: (v: IProductVariant[]) => v.length >= 1,
        message: "حداقل یک Variant لازم است",
      },
    },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
      index: true,
    },
    sortOrder: { type: Number, default: 0, index: true },
    seo: {
      title: { type: String, trim: true },
      description: { type: String, trim: true },
    },
    deletedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true },
);

ProductSchema.plugin(mongoosePaginate);

// Soft delete: exclude deleted products from default queries.
ProductSchema.pre(/^find/, function (this: mongoose.Query<unknown, unknown>) {
  if (this.getFilter().deletedAt === undefined) {
    this.where({ deletedAt: null });
  }
});

type ProductModel = Model<IProduct> & PaginateModel<IProduct>;

export const Product: ProductModel =
  (mongoose.models.Product as ProductModel) ||
  mongoose.model<IProduct, ProductModel>("Product", ProductSchema);
