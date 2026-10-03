import Image from "next/image";
import { ReviewStars } from "@/components/storefront/review-stars";
import type { MyReviewDTO } from "@/lib/reviews/my-review";
import {
  REVIEW_RECOMMENDATION_LABELS,
  REVIEW_STATUS_LABELS,
} from "@/lib/reviews/constants";
import {
  REVIEW_PENDING_MESSAGE,
  REVIEW_REJECTED_MESSAGE,
} from "@/lib/storefront/review-form-messages";
import { formatJalali } from "@/lib/utils/jalali";

const STATUS_STYLE: Record<MyReviewDTO["status"], string> = {
  pending: "bg-amber-50 text-amber-700",
  approved: "bg-green-50 text-green-700",
  rejected: "bg-red-50 text-red-700",
};

/**
 * نظر خودِ کاربر (فقط خواندنی، بدون ویرایش). دلیل رد هرگز نمایش داده
 * نمی‌شود (DTO آن را ندارد). Plain Text؛ بدون dangerouslySetInnerHTML.
 */
export function MyReviewCard({ review }: { review: MyReviewDTO }) {
  return (
    <article className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLE[review.status]}`}
        >
          {REVIEW_STATUS_LABELS[review.status]}
        </span>
        <time dateTime={review.createdAt} className="text-xs text-gray-400">
          {formatJalali(review.createdAt)}
        </time>
      </div>

      {review.status === "pending" ? (
        <p className="text-xs text-gray-600">{REVIEW_PENDING_MESSAGE}</p>
      ) : null}
      {review.status === "rejected" ? (
        <p className="text-xs text-gray-600">{REVIEW_REJECTED_MESSAGE}</p>
      ) : null}

      <div className="flex items-center gap-2">
        <ReviewStars rating={review.rating} className="size-3.5" />
        <span className="text-xs text-gray-500">
          {REVIEW_RECOMMENDATION_LABELS[review.recommendation]}
        </span>
      </div>

      <p className="text-sm leading-7 break-words whitespace-pre-line text-[var(--sf-ink)]">
        {review.text}
      </p>

      {review.images.length > 0 ? (
        <ul className="flex gap-2">
          {review.images.map((img) => (
            <li
              key={img.url}
              className="relative h-16 w-12 overflow-hidden rounded-md bg-gray-100"
            >
              <Image
                src={img.url}
                alt=""
                fill
                sizes="48px"
                className="object-cover"
              />
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}
