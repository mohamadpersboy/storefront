import mongoose, { Schema, type Model, type HydratedDocument, type Types } from "mongoose";

export interface ICategory {
  name: string;
  slug: string;
  parentId: Types.ObjectId | null;
  isActive: boolean;
  sortOrder: number;
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
  },
  { timestamps: true },
);

type CategoryModel = Model<ICategory>;

export const Category: CategoryModel =
  (mongoose.models.Category as CategoryModel) ||
  mongoose.model<ICategory, CategoryModel>("Category", CategorySchema);
