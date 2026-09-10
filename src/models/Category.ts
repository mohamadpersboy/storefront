import mongoose, { Schema, type Model, type HydratedDocument, type Types } from "mongoose";

export interface ICategory {
  name: string;
  slug: string;
  parentId: Types.ObjectId | null;
  isActive: boolean;
  sortOrder: number;
  imageUrl: string | null;
  imagePublicId: string | null;
  imageBlurDataUrl: string | null;
  showOnHomepage: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type CategoryDocument = HydratedDocument<ICategory>;

const CategorySchema = new Schema<ICategory>(
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
    parentId: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      default: null,
      index: true,
    },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
    // فقط برای دسته‌بندی سطح اول معنا دارد (parentId === null)؛ در
    // زیردسته‌ها همیشه باید null/false بماند — این قانون در لایه
    // API اجرا می‌شود (نگاه کنید src/app/api/v1/categories)، نه در
    // خود Schema، چون Mongoose validator بومی برای Cross-field
    // Conditional به این سادگی ندارد.
    imageUrl: { type: String, default: null },
    imagePublicId: { type: String, default: null },
    imageBlurDataUrl: { type: String, default: null },
    showOnHomepage: { type: Boolean, default: false },
  },
  { timestamps: true },
);

type CategoryModel = Model<ICategory>;

export const Category: CategoryModel =
  (mongoose.models.Category as CategoryModel) ||
  mongoose.model<ICategory, CategoryModel>("Category", CategorySchema);
