import {
  REVIEW_MAX_IMAGES,
  REVIEW_RECOMMENDATIONS,
  REVIEW_TEXT_MAX,
  type ReviewRecommendation,
} from "@/lib/reviews/constants";

export const REVIEW_MIN_RATING = 1;
export const REVIEW_MAX_RATING = 5;

export type ReviewFormImage = { url: string; publicId: string };

export type ReviewFormErrors = {
  rating?: string;
  recommendation?: string;
  text?: string;
  images?: string;
};

export type ReviewPayload = {
  productId: string;
  rating: number;
  recommendation: ReviewRecommendation;
  text: string;
  images: ReviewFormImage[];
};

export type BuildReviewPayloadResult =
  | { ok: true; payload: ReviewPayload }
  | { ok: false; errors: ReviewFormErrors };

export const REVIEW_RATING_REQUIRED = "امتیاز را انتخاب کنید.";
export const REVIEW_RECOMMENDATION_REQUIRED =
  "یکی از گزینه‌های توصیه را انتخاب کنید.";
export const REVIEW_TEXT_REQUIRED = "متن نظر را بنویسید.";
export const REVIEW_TEXT_TOO_LONG = "متن نظر نباید بیشتر از ۴۸۰ نویسه باشد.";
export const REVIEW_IMAGES_TOO_MANY = "حداکثر ۲ تصویر مجاز است.";

function isValidRating(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= REVIEW_MIN_RATING &&
    value <= REVIEW_MAX_RATING
  );
}

/**
 * ساخت Payload برای `POST /api/v1/reviews`. فقط ۵ فیلد مجاز ارسال می‌شود
 * (بدون status/order/user). طول متن با `.length` (UTF-16) اندازه‌گیری
 * می‌شود؛ همان معیار Zod در Backend. Backend منبع حقیقت می‌ماند.
 */
export function buildReviewPayload(input: {
  productId: string;
  rating: number | null;
  recommendation: string | null;
  text: string;
  images: ReviewFormImage[];
}): BuildReviewPayloadResult {
  const errors: ReviewFormErrors = {};

  if (!isValidRating(input.rating)) errors.rating = REVIEW_RATING_REQUIRED;

  const recommendation = REVIEW_RECOMMENDATIONS.find(
    (r) => r === input.recommendation,
  );
  if (!recommendation) errors.recommendation = REVIEW_RECOMMENDATION_REQUIRED;

  const text = input.text.trim();
  if (text.length === 0) errors.text = REVIEW_TEXT_REQUIRED;
  else if (text.length > REVIEW_TEXT_MAX) errors.text = REVIEW_TEXT_TOO_LONG;

  if (input.images.length > REVIEW_MAX_IMAGES)
    errors.images = REVIEW_IMAGES_TOO_MANY;

  if (
    Object.keys(errors).length > 0 ||
    !isValidRating(input.rating) ||
    !recommendation
  ) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    payload: {
      productId: input.productId,
      rating: input.rating,
      recommendation,
      text,
      images: input.images.map((img) => ({
        url: img.url,
        publicId: img.publicId,
      })),
    },
  };
}

/**
 * جابه‌جایی امتیاز با کلید در Radiogroup راست‌به‌چپ: ستاره ۱ سمت راست
 * است، پس ArrowLeft = بعدی و ArrowRight = قبلی. Home/End = اول/آخر.
 * `null` یعنی کلید ربطی ندارد.
 */
export function nextRatingForKey(
  current: number | null,
  key: string,
): number | null {
  const base = current ?? REVIEW_MIN_RATING;
  switch (key) {
    case "ArrowLeft":
    case "ArrowDown":
      return current === null
        ? REVIEW_MIN_RATING
        : Math.min(REVIEW_MAX_RATING, base + 1);
    case "ArrowRight":
    case "ArrowUp":
      return current === null
        ? REVIEW_MIN_RATING
        : Math.max(REVIEW_MIN_RATING, base - 1);
    case "Home":
      return REVIEW_MIN_RATING;
    case "End":
      return REVIEW_MAX_RATING;
    default:
      return null;
  }
}
