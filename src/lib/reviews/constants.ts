export const REVIEW_TEXT_MAX = 480;
export const REVIEW_REJECTION_REASON_MAX = 300;
export const REVIEW_MAX_IMAGES = 2;

/** نسبت عرض/ارتفاع تصویر Review (۳:۴ — همان Cropper محصول). */
export const REVIEW_IMAGE_ASPECT = 3 / 4;
/** تلورانس نسبی ۱٪ روی نسبت واقعی تصویر. */
export const REVIEW_IMAGE_ASPECT_TOLERANCE = 0.01;

export const REVIEW_STATUSES = ["pending", "approved", "rejected"] as const;
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

export const REVIEW_RECOMMENDATIONS = ["recommend", "not_recommend"] as const;
export type ReviewRecommendation = (typeof REVIEW_RECOMMENDATIONS)[number];

export const REVIEW_STATUS_LABELS: Record<ReviewStatus, string> = {
  pending: "در انتظار بررسی",
  approved: "تأییدشده",
  rejected: "ردشده",
};

export const REVIEW_RECOMMENDATION_LABELS: Record<ReviewRecommendation, string> = {
  recommend: "توصیه می‌کنم",
  not_recommend: "توصیه نمی‌کنم",
};

/**
 * انتقال‌های مجاز وضعیت (تصمیم قطعی):
 * pending → approved | rejected، approved → rejected.
 * rejected → approved مجاز نیست.
 */
const ALLOWED: Record<ReviewStatus, ReviewStatus[]> = {
  pending: ["approved", "rejected"],
  approved: ["rejected"],
  rejected: [],
};

export function canTransitionReviewStatus(from: ReviewStatus, to: ReviewStatus): boolean {
  return ALLOWED[from]?.includes(to) ?? false;
}

/** وضعیت‌های مبدأ مجاز برای رسیدن به `to` — برای فیلتر اتمیک Update. */
export function statusesThatCanMoveTo(to: ReviewStatus): ReviewStatus[] {
  return REVIEW_STATUSES.filter((from) => canTransitionReviewStatus(from, to));
}
