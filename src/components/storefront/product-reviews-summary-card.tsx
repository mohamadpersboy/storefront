import { ProductReviewsSheet } from "@/components/storefront/product-reviews-sheet";
import { ReviewStars } from "@/components/storefront/review-stars";
import type { PublicReviewStats } from "@/lib/reviews/public-serialize";
import {
  formatAverageRating,
  formatNotRecommendCount,
  formatRecommendCount,
  formatReviewCount,
  formatVerifiedBuyerCount,
  NO_RATING_TEXT,
  NO_REVIEWS_TEXT,
  REVIEW_MAX_STARS,
} from "@/lib/storefront/review-summary-format";
import { toPersianDigits } from "@/lib/utils/format";

/**
 * کارت «نظرات کاربران» (Server Component) — هم‌الگو با کارت‌های
 * «توضیحات/ویژگی‌های محصول» اما با هدر فقط متنی (بدون آیکن/Emoji).
 * همه اعداد از `getProductReviewSummary` (Stats واقعی Backend) می‌آیند.
 * بدون Review: امتیاز جعلی نشان داده نمی‌شود و دکمه «خواندن نظرات» نیست.
 */
export function ProductReviewsSummaryCard({
  productId,
  stats,
}: {
  productId: string;
  stats: PublicReviewStats;
}) {
  const hasReviews = stats.ratingCount > 0;

  return (
    <section className="px-4 pt-3 sm:mx-auto sm:max-w-md sm:px-6">
      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <p className="mb-3 text-sm font-semibold text-[var(--sf-ink)]">نظرات کاربران</p>

        <div className="flex items-center gap-3">
          {hasReviews ? (
            <>
              <p className="text-2xl font-bold text-[var(--sf-ink)]">
                {formatAverageRating(stats.averageRating)}
                <span className="ms-1 text-xs font-normal text-gray-500">
                  از {toPersianDigits(REVIEW_MAX_STARS)}
                </span>
              </p>
              <div className="flex flex-col gap-1">
                <ReviewStars rating={stats.averageRating} />
                <p className="text-xs text-gray-500">{formatReviewCount(stats.ratingCount)}</p>
              </div>
            </>
          ) : (
            <div className="flex flex-col gap-0.5">
              <p className="text-sm font-medium text-[var(--sf-ink)]">{NO_REVIEWS_TEXT}</p>
              <p className="text-xs text-gray-500">{NO_RATING_TEXT}</p>
            </div>
          )}
        </div>

        <ul className="mt-3 flex flex-col gap-1 rounded-xl bg-gray-100 px-3 py-2.5 text-xs text-gray-600">
          <li>{formatRecommendCount(stats.recommendCount)}</li>
          <li>{formatNotRecommendCount(stats.notRecommendCount)}</li>
          <li>{formatVerifiedBuyerCount(stats.verifiedBuyerCount)}</li>
        </ul>

        {hasReviews ? (
          <div className="mt-3">
            <ProductReviewsSheet productId={productId} stats={stats} />
          </div>
        ) : null}
      </div>
    </section>
  );
}
