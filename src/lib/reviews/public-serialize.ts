import type { ReviewRecommendation } from "@/lib/reviews/constants";
import type { ProductReviewStats } from "@/lib/reviews/queries";

/** فقط نوع‌ها (بدون وابستگی Runtime به DB) — Client هم می‌تواند import کند. */
export interface PublicReviewImageDTO {
  url: string;
  width: number;
  height: number;
}

/**
 * DTO عمومی Review. عمداً فاقد: شناسه کاربر، `publicId` تصویر، `order`،
 * `moderatedBy`، `rejectionReason`، `status`، `deletedAt` و هر فیلد داخلی دیگر.
 */
export interface PublicReviewDTO {
  displayName: string;
  rating: number;
  recommendation: ReviewRecommendation;
  text: string;
  isVerifiedBuyer: boolean;
  images: PublicReviewImageDTO[];
  createdAt: string;
}

export interface PublicReviewStats extends ProductReviewStats {
  notRecommendCount: number;
}

export interface PublicReviewsPagination {
  totalDocs: number;
  totalPages: number;
  page: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PublicReviewsResponseData {
  items: PublicReviewDTO[];
  stats: PublicReviewStats;
}

export const FALLBACK_DISPLAY_NAME = "کاربر";

/**
 * نام نمایشی privacy-friendly: «نام + حرف اول آخرین بخش نام خانوادگی».
 * «محمد رضایی» → «محمد ر.» | تک‌کلمه‌ای → همان کلمه | خالی یا شبیه
 * شماره/نماد (بدون هیچ حرف) → «کاربر». هرگز شماره تلفن نمایش داده نمی‌شود.
 */
export function toPublicDisplayName(fullName: string | null | undefined): string {
  const tokens = (fullName ?? "").trim().split(/\s+/).filter(Boolean);
  const hasLetter = (t: string) => /\p{L}/u.test(t);
  const words = tokens.filter(hasLetter);
  if (words.length === 0) return FALLBACK_DISPLAY_NAME;

  const first = words[0];
  if (words.length === 1) return first;

  const last = words[words.length - 1];
  const initial = Array.from(last)[0];
  return `${first} ${initial}.`;
}

/** `notRecommendCount` = همه Reviewها − توصیه‌شده‌ها (هر Review دقیقاً یک Recommendation دارد). */
export function toPublicReviewStats(stats: ProductReviewStats): PublicReviewStats {
  return {
    ...stats,
    notRecommendCount: Math.max(0, stats.ratingCount - stats.recommendCount),
  };
}

export interface LeanPublicReview {
  rating: number;
  text: string;
  recommendation: ReviewRecommendation;
  isVerifiedBuyer?: boolean;
  images?: Array<{ url: string; publicId?: string; width: number; height: number }>;
  createdAt: Date | string;
}

export function toPublicReviewDTO(doc: LeanPublicReview, fullName: string | null | undefined): PublicReviewDTO {
  return {
    displayName: toPublicDisplayName(fullName),
    rating: doc.rating,
    recommendation: doc.recommendation,
    text: doc.text,
    isVerifiedBuyer: doc.isVerifiedBuyer === true,
    // فقط فیلدهای مجاز، یکی‌یکی (نه Spread) تا فیلد داخلی جدید ناخواسته نشت نکند.
    images: (doc.images ?? []).map((i) => ({ url: i.url, width: i.width, height: i.height })),
    createdAt: new Date(doc.createdAt).toISOString(),
  };
}
