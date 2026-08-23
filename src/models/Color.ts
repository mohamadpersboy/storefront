import mongoose, { Schema, type Model, type HydratedDocument } from "mongoose";

export interface IColor {
  name: string; // مثلاً "قرمز آجری"
  hexCode: string; // مثلاً "#B33A3A"
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export type ColorDocument = HydratedDocument<IColor>;

const ColorSchema = new Schema<IColor>(
  {
    name: { type: String, required: true, trim: true, minlength: 2, unique: true },
    hexCode: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      match: /^#[0-9A-F]{6}$/,
    },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true },
);

type ColorModel = Model<IColor>;

export const Color: ColorModel =
  (mongoose.models.Color as ColorModel) ||
  mongoose.model<IColor, ColorModel>("Color", ColorSchema);
