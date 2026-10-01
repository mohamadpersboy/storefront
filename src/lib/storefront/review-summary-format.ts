import { toPersianDigits } from "@/lib/utils/format";
import type { PublicReviewStats } from "@/lib/reviews/public-serialize";

export const REVIEW_MAX_STARS = 5;

/** «۴.۳» برای اعشاری، «۵» برای صحیح. */
export function formatAverageRating(average: number): string {
  const rounded = Math.round(average * 10) / 10;
  return toPersianDigits(Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1));
}

export function formatRatingOutOfFive(average: number): string {
  return `${formatAverageRating(average)} از ${toPersianDigits(REVIEW_MAX_STARS)}`;
}

export const formatReviewCount = (n: number) => `${toPersianDigits(n)} نظر`;
export const formatRecommendCount = (n: number) => `${toPersianDigits(n)} نفر توصیه کرده‌اند`;
export const formatNotRecommendCount = (n: number) => `${toPersianDigits(n)} نفر توصیه نکرده‌اند`;
export const formatVerifiedBuyerCount = (n: number) => `${toPersianDigits(n)} خریدار نظر داده‌اند`;

export const NO_REVIEWS_TEXT = "هنوز نظری ثبت نشده";
export const NO_RATING_TEXT = "بدون امتیاز";

/** «۱۲ نظر · ۴.۳ از ۵» — بدون Review: «هنوز نظری ثبت نشده». */
export function formatSheetSubtitle(stats: PublicReviewStats): string {
  if (stats.ratingCount === 0) return NO_REVIEWS_TEXT;
  return `${formatReviewCount(stats.ratingCount)} · ${formatRatingOutOfFive(stats.averageRating)}`;
}

/** درصد پر بودن ردیف ستاره‌ها (۰ تا ۱۰۰) برای امتیاز اعشاری. */
export function ratingToFillPercent(rating: number): number {
  const clamped = Math.min(REVIEW_MAX_STARS, Math.max(0, rating));
  return (clamped / REVIEW_MAX_STARS) * 100;
}
