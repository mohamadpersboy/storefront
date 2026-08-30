import mongoose, { Schema, type Model, type HydratedDocument } from "mongoose";

export interface IProvince {
  name: string;
  code: string; // کد استان — منبع Import (بند ۳ سند Audit)
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export type ProvinceDocument = HydratedDocument<IProvince>;

const ProvinceSchema = new Schema<IProvince>(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true, unique: true },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true },
);

type ProvinceModel = Model<IProvince>;

export const Province: ProvinceModel =
  (mongoose.models.Province as ProvinceModel) ||
  mongoose.model<IProvince, ProvinceModel>("Province", ProvinceSchema);
