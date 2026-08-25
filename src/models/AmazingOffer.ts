import mongoose, { Schema, type Model, type HydratedDocument, type Types } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import type { PaginateModel } from "mongoose";
import "mongoose-paginate-v2";

export type AmazingOfferDiscountType = "percent" | "fixed";

export interface IAmazingOffer {
  productId: Types.ObjectId;
  variantId: Types.ObjectId; // matches an _id inside Product.variants
  discountType: AmazingOfferDiscountType;
  discountValue: number;
  startAt: Date;
  endAt: Date;
  // Manual pause/cancel switch by the admin — independent from the
  // time-based expiry derived from startAt/endAt (Master Prompt §25:
  // "وضعیت Offer باید در Backend قابل تشخیص باشد" — both the schedule
  // *and* an explicit admin override are tracked, never inferred only
  // from one of them).
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type AmazingOfferDocument = HydratedDocument<IAmazingOffer>;

const AmazingOfferSchema = new Schema<IAmazingOffer>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    variantId: { type: Schema.Types.ObjectId, required: true, index: true },
    discountType: {
      type: String,
      enum: ["percent", "fixed"],
      required: true,
    },
    discountValue: { type: Number, required: true, min: 0 },
    startAt: { type: Date, required: true },
    endAt: { type: Date, required: true, index: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

AmazingOfferSchema.plugin(mongoosePaginate);

type AmazingOfferModel = Model<IAmazingOffer> & PaginateModel<IAmazingOffer>;

export const AmazingOffer: AmazingOfferModel =
  (mongoose.models.AmazingOffer as AmazingOfferModel) ||
  mongoose.model<IAmazingOffer, AmazingOfferModel>("AmazingOffer", AmazingOfferSchema);
