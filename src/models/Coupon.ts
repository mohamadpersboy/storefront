import mongoose, { Schema, type Model, type HydratedDocument, type Types } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import type { PaginateModel } from "mongoose";
import "mongoose-paginate-v2";

export type CouponStatus = "active" | "inactive";
export type CouponType = "public" | "private";

export interface ICoupon {
  code: string; // stored uppercase, unique
  discountPercentage: number; // 0-100
  // null = no cap / no minimum, kept explicit rather than 0 so "no
  // limit" can never be confused with "limit of zero".
  maxDiscountAmount: number | null;
  minOrderAmount: number;
  startsAt: Date | null;
  expiresAt: Date;
  status: CouponStatus;
  type: CouponType;
  allowedUsers: Types.ObjectId[]; // only meaningful when type === "private"
  usageLimit: number | null;
  usedCount: number;
  perUserLimit: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export type CouponDocument = HydratedDocument<ICoupon>;

const CouponSchema = new Schema<ICoupon>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    discountPercentage: { type: Number, required: true, min: 0, max: 100 },
    maxDiscountAmount: { type: Number, default: null, min: 0 },
    minOrderAmount: { type: Number, default: 0, min: 0 },
    startsAt: { type: Date, default: null },
    expiresAt: { type: Date, required: true, index: true },
    status: { type: String, enum: ["active", "inactive"], default: "active", index: true },
    type: { type: String, enum: ["public", "private"], default: "public" },
    allowedUsers: { type: [Schema.Types.ObjectId], ref: "User", default: [] },
    usageLimit: { type: Number, default: null, min: 1 },
    usedCount: { type: Number, default: 0, min: 0 },
    perUserLimit: { type: Number, default: null, min: 1 },
  },
  { timestamps: true },
);

CouponSchema.plugin(mongoosePaginate);

type CouponModel = Model<ICoupon> & PaginateModel<ICoupon>;

export const Coupon: CouponModel =
  (mongoose.models.Coupon as CouponModel) ||
  mongoose.model<ICoupon, CouponModel>("Coupon", CouponSchema);
