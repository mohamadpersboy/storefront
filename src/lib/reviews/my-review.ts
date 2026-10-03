import { Types } from "mongoose";
import { Review } from "@/models/Review";
import { resolveProductReviewState } from "@/lib/reviews/eligibility";
import type {
  ReviewRecommendation,
  ReviewStatus,
} from "@/lib/reviews/constants";

/** تصویر Review خود کاربر — بدون `publicId` (فقط URL و ابعاد سروری). */
export interface MyReviewImageDTO {
  url: string;
  width: number;
  height: number;
}

/**
 * DTO خصوصی Review فعال خود کاربر. عمداً فاقد: `rejectionReason`،
 * `publicId`، `order`، `user`، `product`، `moderatedBy` و هر فیلد داخلی.
 */
export interface MyReviewDTO {
  id: string;
  status: ReviewStatus;
  rating: number;
  recommendation: ReviewRecommendation;
  text: string;
  images: MyReviewImageDTO[];
  createdAt: string;
}

/** چرا ثبت نظر ممکن نیست: فقط خریداران (archived) یا محصول در دسترس نیست. */
export type ReviewIneligibleReason = "buyers_only" | "unavailable";

export interface MyReviewState {
  /** Review فعال (حذف‌نشده) همین کاربر برای این محصول، یا `null`. */
  review: MyReviewDTO | null;
  /** از `resolveProductReviewState` — مستقل از وجود Review فعال. */
  canReview: boolean;
  /** فقط Verified Buyer. */
  canAddImages: boolean;
  ineligibleReason: ReviewIneligibleReason | null;
}

interface LeanMyReview {
  _id: unknown;
  status: ReviewStatus;
  rating: number;
  recommendation: ReviewRecommendation;
  text: string;
  images?: Array<{
    url: string;
    publicId?: string;
    width: number;
    height: number;
  }>;
  createdAt: Date | string;
}

export function toMyReviewDTO(doc: LeanMyReview): MyReviewDTO {
  return {
    id: String(doc._id),
    status: doc.status,
    rating: doc.rating,
    recommendation: doc.recommendation,
    text: doc.text,
    // فقط فیلدهای مجاز، یکی‌یکی (نه Spread).
    images: (doc.images ?? []).map((i) => ({
      url: i.url,
      width: i.width,
      height: i.height,
    })),
    createdAt: new Date(doc.createdAt).toISOString(),
  };
}

/**
 * وضعیت Review کاربر برای صفحه محصول (Server Component). فقط Review
 * فعال خودِ همین کاربر خوانده می‌شود (`deletedAt: null`)؛ Review کاربر
 * دیگر هرگز برنمی‌گردد. قوانین eligibility از `resolveProductReviewState`
 * می‌آید و اینجا دوباره تعریف نمی‌شود.
 */
export async function getMyReviewState(
  userId: string,
  productId: string,
): Promise<MyReviewState> {
  if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(productId)) {
    return {
      review: null,
      canReview: false,
      canAddImages: false,
      ineligibleReason: "unavailable",
    };
  }

  const [eligibility, doc] = await Promise.all([
    resolveProductReviewState(userId, productId),
    Review.findOne({
      user: new Types.ObjectId(userId),
      product: new Types.ObjectId(productId),
      deletedAt: null,
    })
      .select("status rating recommendation text images createdAt")
      .lean(),
  ]);

  const review = doc ? toMyReviewDTO(doc as unknown as LeanMyReview) : null;

  if (!eligibility.ok) {
    return {
      review,
      canReview: false,
      canAddImages: false,
      ineligibleReason:
        eligibility.status === 403 ? "buyers_only" : "unavailable",
    };
  }

  return {
    review,
    canReview: true,
    canAddImages: eligibility.isVerifiedBuyer,
    ineligibleReason: null,
  };
}
