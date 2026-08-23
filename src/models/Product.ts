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
  attributes: IVariantAttribute[];
  sku?: string;
  price: number; // قیمت پایه این Variant (تومان)
  discountPercent: number; // 0-100، 0 یعنی بدون تخفیف
  discountAmount: number; // تخفیف مبلغ ثابت (تومان)، 0 یعنی بدون تخفیف
  stock: number;
  isActive: boolean;
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
  images: IProductImage[];
  variants: IProductVariant[];
  status: ProductStatus;
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
  attributes: { type: [VariantAttributeSchema], default: [] },
  sku: { type: String, trim: true },
  price: { type: Number, required: true, min: 0 },
  discountPercent: { type: Number, default: 0, min: 0, max: 100 },
  discountAmount: { type: Number, default: 0, min: 0 },
  stock: { type: Number, required: true, min: 0, default: 0 },
  isActive: { type: Boolean, default: true },
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
