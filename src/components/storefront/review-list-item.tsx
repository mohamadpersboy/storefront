import Image from "next/image";
import { ReviewStars } from "@/components/storefront/review-stars";
import type {
  PublicReviewDTO,
  PublicReviewImageDTO,
} from "@/lib/reviews/public-serialize";
import { collapseBlankLines } from "@/lib/storefront/review-text";
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
    <article className="mb-3 rounded-2xl bg-gray-100 p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <p className="truncate text-sm font-medium text-[var(--sf-ink)]">
            {review.displayName}
          </p>
          {review.isVerifiedBuyer ? (
            <span className="shrink-0 rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-medium text-green-700">
              خریدار
            </span>
          ) : null}
        </div>
        <time
          dateTime={review.createdAt}
          className="shrink-0 text-xs text-gray-400"
        >
          {formatJalali(review.createdAt)}
        </time>
      </div>

      <p className="mt-2 line-clamp-5 text-sm leading-7 break-words whitespace-pre-line text-gray-700">
        {collapseBlankLines(review.text)}
      </p>

      <div className="mt-2 flex items-center gap-2">
        <ReviewStars rating={review.rating} className="size-3.5" />
        <span className="text-xs text-gray-500">
          {RECOMMENDATION_TEXT[review.recommendation]}
        </span>
      </div>

      {review.images.length > 0 ? (
        <div className="mt-2 flex gap-2">
          {review.images.map((image) => (
            <button
              key={image.url}
              type="button"
              onClick={() => onImageClick(image)}
              aria-label="مشاهده تصویر بزرگ"
              className="h-16 w-12 shrink-0 overflow-hidden rounded-lg bg-gray-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]"
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
