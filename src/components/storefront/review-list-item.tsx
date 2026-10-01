import Image from "next/image";
import { ReviewStars } from "@/components/storefront/review-stars";
import type { PublicReviewDTO, PublicReviewImageDTO } from "@/lib/reviews/public-serialize";
import { formatJalali } from "@/lib/utils/jalali";

const RECOMMENDATION_TEXT = {
  recommend: "توصیه می‌کنم",
  not_recommend: "توصیه نمی‌کنم",
} as const;

/**
 * یک Review. متن Plain Text است (React خودش Escape می‌کند؛ بدون
 * `dangerouslySetInnerHTML`). Thumbnailها ۴۸×۶۴ (۳:۴) زیر متن هستند تا
 * متن عرض کامل داشته باشد.
 */
export function ReviewListItem({
  review,
  onImageClick,
}: {
  review: PublicReviewDTO;
  onImageClick: (image: PublicReviewImageDTO) => void;
}) {
  return (
    <article className="border-b border-gray-100 py-4 last:border-b-0">
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-sm font-medium text-[var(--sf-ink)]">
          {review.displayName}
          {review.isVerifiedBuyer ? (
            <span className="ms-2 text-xs font-normal text-gray-500">خریدار</span>
          ) : null}
        </p>
        <time dateTime={review.createdAt} className="shrink-0 text-xs text-gray-400">
          {formatJalali(review.createdAt)}
        </time>
      </div>

      <div className="mt-1.5 flex items-center gap-2">
        <ReviewStars rating={review.rating} className="size-3.5" />
        <span className="text-xs text-gray-500">{RECOMMENDATION_TEXT[review.recommendation]}</span>
      </div>

      <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-7 text-gray-600">{review.text}</p>

      {review.images.length > 0 ? (
        <div className="mt-2 flex gap-2">
          {review.images.map((image) => (
            <button
              key={image.url}
              type="button"
              onClick={() => onImageClick(image)}
              aria-label="مشاهده تصویر بزرگ"
              className="h-16 w-12 shrink-0 overflow-hidden rounded-lg bg-gray-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--sf-accent)]"
            >
              <Image
                src={image.url}
                alt="تصویر نظر"
                width={48}
                height={64}
                sizes="48px"
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      ) : null}
    </article>
  );
}
