import mongoose, { Schema, type Model, type HydratedDocument, type Types } from "mongoose";

export interface ICity {
  name: string;
  code: string; // کد شهر — منبع Import (بند ۳ سند Audit)
  province: Types.ObjectId; // ref Province
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type CityDocument = HydratedDocument<ICity>;

const CitySchema = new Schema<ICity>(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true, unique: true },
    province: { type: Schema.Types.ObjectId, ref: "Province", required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

// جستجوی شهرهای یک استان (مورد اصلی استفاده در Address Dropdown) باید
// Index داشته باشد — بدون آن هر درخواست یک Collection Scan کامل می‌شود.
CitySchema.index({ province: 1, name: 1 });

type CityModel = Model<ICity>;

export const City: CityModel =
  (mongoose.models.City as CityModel) ||
  mongoose.model<ICity, CityModel>("City", CitySchema);
