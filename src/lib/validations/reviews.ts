import { z } from "zod";
import {
  REVIEW_MAX_IMAGES,
  REVIEW_RECOMMENDATIONS,
  REVIEW_REJECTION_REASON_MAX,
  REVIEW_STATUSES,
  REVIEW_TEXT_MAX,
} from "@/lib/reviews/constants";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "شناسه نامعتبر است");

/** فقط url + publicId از Client قبول می‌شود؛ ابعاد را سرور از Cloudinary می‌خواند. */
export const reviewImageInputSchema = z.object({
  url: z.string().trim().min(1, "آدرس تصویر لازم است").max(500),
  publicId: z.string().trim().min(1, "شناسه تصویر لازم است").max(300),
});

export const createReviewSchema = z.object({
  productId: objectId,
  text: z
    .string()
    .trim()
    .min(1, "متن نظر لازم است")
    .max(REVIEW_TEXT_MAX, `متن نظر حداکثر ${REVIEW_TEXT_MAX} نویسه می‌تواند باشد`),
  rating: z
    .number({ error: "امتیاز نامعتبر است" })
    .int("امتیاز باید عدد صحیح باشد")
    .min(1, "امتیاز باید بین ۱ تا ۵ باشد")
    .max(5, "امتیاز باید بین ۱ تا ۵ باشد"),
  recommendation: z.enum(REVIEW_RECOMMENDATIONS, { error: "گزینه توصیه نامعتبر است" }),
  images: z
    .array(reviewImageInputSchema)
    .max(REVIEW_MAX_IMAGES, `حداکثر ${REVIEW_MAX_IMAGES} تصویر مجاز است`)
    .default([]),
});
export type CreateReviewInput = z.infer<typeof createReviewSchema>;

export const reviewImageSignSchema = z.object({ productId: objectId });

export const rejectReviewSchema = z.object({
  rejectionReason: z
    .string()
    .trim()
    .max(REVIEW_REJECTION_REASON_MAX, `دلیل رد حداکثر ${REVIEW_REJECTION_REASON_MAX} نویسه می‌تواند باشد`)
    .optional()
    .transform((v) => (v ? v : null)),
});

export const adminReviewsListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  status: z.enum(REVIEW_STATUSES).optional(),
  product: objectId.optional(),
  user: objectId.optional(),
  rating: z.coerce.number().int().min(1).max(5).optional(),
  verified: z.enum(["true", "false"]).optional(),
  search: z.string().trim().max(100).optional(),
});
export type AdminReviewsListQuery = z.infer<typeof adminReviewsListQuerySchema>;
