import mongoose, {
  Schema,
  type Model,
  type HydratedDocument,
  type PaginateModel,
  type Types,
} from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import "mongoose-paginate-v2";
import {
  REVIEW_MAX_IMAGES,
  REVIEW_RECOMMENDATIONS,
  REVIEW_REJECTION_REASON_MAX,
  REVIEW_STATUSES,
  REVIEW_TEXT_MAX,
  type ReviewRecommendation,
  type ReviewStatus,
} from "@/lib/reviews/constants";

export interface IReviewImage {
  url: string;
  publicId: string;
  // ابعاد واقعی از Cloudinary Admin API — نه از Client.
  width: number;
  height: number;
}

export interface IReview {
  product: Types.ObjectId;
  user: Types.ObjectId;
  rating: number;
  text: string; // Plain Text، حداکثر ۴۸۰ نویسه
  recommendation: ReviewRecommendation;
  status: ReviewStatus;
  // Snapshot لحظه ثبت — تغییر بعدی Order روی آن اثر ندارد.
  isVerifiedBuyer: boolean;
  order: Types.ObjectId | null;
  images: IReviewImage[];
  moderatedBy: Types.ObjectId | null;
  moderatedAt: Date | null;
  rejectionReason: string | null;
  deletedAt: Date | null; // Soft delete
  createdAt: Date;
  updatedAt: Date;
}

export type ReviewDocument = HydratedDocument<IReview>;

const ReviewImageSchema = new Schema<IReviewImage>(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    width: { type: Number, required: true, min: 1 },
    height: { type: Number, required: true, min: 1 },
  },
  { _id: false },
);

const ReviewSchema = new Schema<IReview>(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      validate: { validator: Number.isInteger, message: "امتیاز باید عدد صحیح باشد" },
    },
    text: { type: String, required: true, trim: true, maxlength: REVIEW_TEXT_MAX },
    recommendation: { type: String, enum: REVIEW_RECOMMENDATIONS, required: true },
    status: { type: String, enum: REVIEW_STATUSES, default: "pending", required: true },
    isVerifiedBuyer: { type: Boolean, default: false },
    order: { type: Schema.Types.ObjectId, ref: "Order", default: null },
    images: {
      type: [ReviewImageSchema],
      default: [],
      validate: {
        validator: (v: IReviewImage[]) => v.length <= REVIEW_MAX_IMAGES,
        message: `حداکثر ${REVIEW_MAX_IMAGES} تصویر مجاز است`,
      },
    },
    moderatedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    moderatedAt: { type: Date, default: null },
    rejectionReason: { type: String, trim: true, maxlength: REVIEW_REJECTION_REASON_MAX, default: null },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

ReviewSchema.plugin(mongoosePaginate);

ReviewSchema.index({ product: 1, status: 1, createdAt: -1 });
ReviewSchema.index({ status: 1, createdAt: -1 });
ReviewSchema.index({ user: 1, createdAt: -1 });
// فقط یک Review «فعال» برای هر (کاربر، محصول)؛ بعد از Soft Delete دوباره مجاز است.
// `deletedAt` همیشه با `default: null` ذخیره می‌شود، پس `$type: "null"` کافی است.
ReviewSchema.index(
  { user: 1, product: 1 },
  { unique: true, partialFilterExpression: { deletedAt: { $type: "null" } } },
);

type ReviewModel = Model<IReview> & PaginateModel<IReview>;

export const Review: ReviewModel =
  (mongoose.models.Review as ReviewModel) ||
  mongoose.model<IReview, ReviewModel>("Review", ReviewSchema);
