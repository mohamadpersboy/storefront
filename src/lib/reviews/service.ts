import { Types } from "mongoose";
import { Review, type IReviewImage, type ReviewDocument } from "@/models/Review";
import type { CreateReviewInput } from "@/lib/validations/reviews";
import { resolveProductReviewState } from "@/lib/reviews/eligibility";
import { cleanupReviewImages, validateReviewImages } from "@/lib/reviews/images";
import {
  canTransitionReviewStatus,
  statusesThatCanMoveTo,
  type ReviewStatus,
} from "@/lib/reviews/constants";

export type ServiceResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: 403 | 404 | 409 | 422; message: string; errors?: Record<string, string[]> };

const fail = (
  status: 403 | 404 | 409 | 422,
  message: string,
  errors?: Record<string, string[]>,
): { ok: false; status: 403 | 404 | 409 | 422; message: string; errors?: Record<string, string[]> } => ({
  ok: false,
  status,
  message,
  errors,
});

function isDuplicateKeyError(error: unknown): boolean {
  return typeof error === "object" && error !== null && (error as { code?: number }).code === 11000;
}

const DUPLICATE_MESSAGE = "شما قبلاً برای این محصول نظر ثبت کرده‌اید";

/**
 * ثبت Review. سرور خودش محصول، خریدار بودن، مجاز بودن تصویر و تکراری
 * بودن را تعیین می‌کند؛ `status`/`isVerifiedBuyer`/`order` هرگز از Client
 * نمی‌آیند.
 */
export async function createReview(
  userId: string,
  input: CreateReviewInput,
): Promise<ServiceResult<ReviewDocument>> {
  const state = await resolveProductReviewState(userId, input.productId);
  if (!state.ok) return fail(state.status, state.message);

  const existing = await Review.exists({
    user: new Types.ObjectId(userId),
    product: new Types.ObjectId(input.productId),
    deletedAt: null,
  });
  if (existing) return fail(409, DUPLICATE_MESSAGE);

  let images: IReviewImage[] = [];
  if (input.images.length > 0) {
    if (!state.isVerifiedBuyer) {
      return fail(403, "ارسال تصویر فقط برای خریداران این محصول ممکن است", {
        images: ["ارسال تصویر فقط برای خریداران این محصول ممکن است"],
      });
    }
    const validated = await validateReviewImages(input.images, userId);
    if (!validated.ok) return fail(422, validated.message, { images: [validated.message] });
    images = validated.images;
  }

  try {
    const review = await Review.create({
      product: input.productId,
      user: userId,
      rating: input.rating,
      text: input.text,
      recommendation: input.recommendation,
      status: "pending",
      isVerifiedBuyer: state.isVerifiedBuyer,
      order: state.orderId,
      images,
    });
    return { ok: true, data: review };
  } catch (error) {
    // Race: دو ثبت هم‌زمان — Unique Index جزئی جلوی دومی را می‌گیرد.
    if (isDuplicateKeyError(error)) return fail(409, DUPLICATE_MESSAGE);
    throw error;
  }
}

async function softDelete(filter: Record<string, unknown>): Promise<ServiceResult<ReviewDocument>> {
  const review = await Review.findOneAndUpdate(
    { ...filter, deletedAt: null },
    { $set: { deletedAt: new Date() } },
    { new: true },
  );
  if (!review) return fail(404, "نظر پیدا نشد");
  // Best-effort و غیرمسدودکننده: شکست پاک‌سازی تصویر، حذف را خراب نمی‌کند.
  void cleanupReviewImages((review.images ?? []).map((i) => i.publicId)).catch(() => undefined);
  return { ok: true, data: review };
}

/** حذف نظر توسط خود کاربر. نظر دیگران = ۴۰۴ (افشا نکردن وجود). */
export async function deleteOwnReview(
  userId: string,
  reviewId: string,
): Promise<ServiceResult<ReviewDocument>> {
  if (!Types.ObjectId.isValid(reviewId)) return fail(404, "نظر پیدا نشد");
  return softDelete({ _id: reviewId, user: userId });
}

export async function adminDeleteReview(reviewId: string): Promise<ServiceResult<ReviewDocument>> {
  if (!Types.ObjectId.isValid(reviewId)) return fail(404, "نظر پیدا نشد");
  return softDelete({ _id: reviewId });
}

/**
 * تغییر وضعیت با فیلتر اتمیک روی وضعیت مبدأ (Approve/Reject تکراری
 * یا هم‌زمان هرگز دوبار اعمال نمی‌شود).
 */
export async function moderateReview(params: {
  reviewId: string;
  to: Extract<ReviewStatus, "approved" | "rejected">;
  moderatorId: string;
  rejectionReason?: string | null;
}): Promise<ServiceResult<ReviewDocument>> {
  const { reviewId, to, moderatorId } = params;
  if (!Types.ObjectId.isValid(reviewId)) return fail(404, "نظر پیدا نشد");

  const updated = await Review.findOneAndUpdate(
    { _id: reviewId, deletedAt: null, status: { $in: statusesThatCanMoveTo(to) } },
    {
      $set: {
        status: to,
        moderatedBy: moderatorId,
        moderatedAt: new Date(),
        rejectionReason: to === "rejected" ? (params.rejectionReason ?? null) : null,
      },
    },
    { new: true },
  );
  if (updated) return { ok: true, data: updated };

  const current = await Review.findOne({ _id: reviewId, deletedAt: null }).select("status").lean();
  if (!current) return fail(404, "نظر پیدا نشد");
  if (!canTransitionReviewStatus(current.status, to)) {
    return fail(409, "این تغییر وضعیت برای نظر مجاز نیست");
  }
  return fail(409, "وضعیت نظر هم‌زمان تغییر کرد؛ دوباره تلاش کنید");
}

/** برای Route امضای آپلود: آیا این کاربر برای این محصول اجازه آپلود تصویر Review دارد؟ */
export async function checkReviewImageUploadEligibility(
  userId: string,
  productId: string,
): Promise<ServiceResult<null>> {
  const state = await resolveProductReviewState(userId, productId);
  if (!state.ok) return fail(state.status, state.message);
  if (!state.isVerifiedBuyer) {
    return fail(403, "ارسال تصویر فقط برای خریداران این محصول ممکن است");
  }
  return { ok: true, data: null };
}
