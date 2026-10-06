import type { ReactNode } from "react";
import {
  MessageSquare,
  MessageSquareText,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import { ProductReviewsSheet } from "@/components/storefront/product-reviews-sheet";
import { ReviewStars } from "@/components/storefront/review-stars";
import type { PublicReviewStats } from "@/lib/reviews/public-serialize";
import {
  formatAverageRating,
  NO_RATING_TEXT,
  NO_REVIEWS_TEXT,
  REVIEW_MAX_STARS,
} from "@/lib/storefront/review-summary-format";
import { toPersianDigits } from "@/lib/utils/format";

function StatTile({
  icon: Icon,
  iconClassName,
  value,
  label,
}: {
  icon: typeof ThumbsUp;
  iconClassName: string;
  value: number;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-2xl bg-gray-100 px-2 py-3">
      <Icon
        className={`size-5 ${iconClassName}`}
        strokeWidth={1.75}
        aria-hidden="true"
      />
      <p className="text-lg font-bold text-[var(--sf-ink)]">
        {toPersianDigits(value)}
      </p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}

/**
 * کارت «نظرات کاربران» (Server Component). همه اعداد از Stats واقعی
 * Backend می‌آیند. دیدن/نوشتن/حذف نظر فقط داخل پاپ‌آپ است؛
 * `children` (ناحیه نظر کاربر) به بالای لیست پاپ‌آپ می‌رود.
 */
export function ProductReviewsSummaryCard({
  productId,
  stats,
  children,
}: {
  productId: string;
  stats: PublicReviewStats;
  children?: ReactNode;
}) {
  const hasReviews = stats.ratingCount > 0;

  return (
    <section className="px-4 pt-3 tab:mx-auto tab:max-w-md tab:px-6">
      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center gap-2.5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--sf-accent-soft)] text-[var(--sf-accent)]">
            <MessageSquare
              className="size-[18px]"
              strokeWidth={1.75}
              aria-hidden="true"
            />
          </span>
          <p className="text-sm font-semibold text-[var(--sf-ink)]">
            نظرات کاربران
          </p>
        </div>

        <div className="flex flex-col items-center gap-1.5 text-center">
          {hasReviews ? (
            <>
              <p className="text-3xl font-bold text-[var(--sf-ink)]">
                {formatAverageRating(stats.averageRating)}
                <span className="ms-1 text-xs font-normal text-gray-500">
                  از {toPersianDigits(REVIEW_MAX_STARS)}
                </span>
              </p>
              <ReviewStars rating={stats.averageRating} className="size-5" />
            </>
          ) : (
            <>
              <p className="text-sm font-medium text-[var(--sf-ink)]">
                {NO_REVIEWS_TEXT}
              </p>
              <p className="text-xs text-gray-500">{NO_RATING_TEXT}</p>
            </>
          )}
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <StatTile
            icon={MessageSquareText}
            iconClassName="text-[var(--sf-accent)]"
            value={stats.ratingCount}
            label="نظرات"
          />
          <StatTile
            icon={ThumbsUp}
            iconClassName="text-green-600"
            value={stats.recommendCount}
            label="توصیه می‌کنم"
          />
          <StatTile
            icon={ThumbsDown}
            iconClassName="text-red-500"
            value={stats.notRecommendCount}
            label="توصیه نمی‌کنم"
          />
        </div>

        <div className="mt-4">
          <ProductReviewsSheet
            productId={productId}
            stats={stats}
            hasReviews={hasReviews}
          >
            {children}
          </ProductReviewsSheet>
        </div>
      </div>
    </section>
  );
}
