import { describe, expect, it } from "vitest";
import {
  formatAverageRating,
  formatNotRecommendCount,
  formatRatingOutOfFive,
  formatRecommendCount,
  formatReviewCount,
  formatSheetSubtitle,
  formatVerifiedBuyerCount,
  NO_REVIEWS_TEXT,
  ratingToFillPercent,
} from "@/lib/storefront/review-summary-format";

const stats = { averageRating: 4.3, ratingCount: 12, recommendCount: 10, notRecommendCount: 2, verifiedBuyerCount: 8 };

describe("review summary formatting (Persian digits)", () => {
  it("formats the summary lines", () => {
    expect(formatReviewCount(12)).toBe("۱۲ نظر");
    expect(formatRatingOutOfFive(4.3)).toBe("۴.۳ از ۵");
    expect(formatRecommendCount(10)).toBe("۱۰ نفر توصیه کرده‌اند");
    expect(formatNotRecommendCount(2)).toBe("۲ نفر توصیه نکرده‌اند");
    expect(formatVerifiedBuyerCount(8)).toBe("۸ خریدار نظر داده‌اند");
  });

  it("rounds to one decimal and drops «.0»", () => {
    expect(formatAverageRating(4.333)).toBe("۴.۳");
    expect(formatAverageRating(5)).toBe("۵");
    expect(formatAverageRating(4.96)).toBe("۵");
  });

  it("builds the sheet subtitle, and the empty-state text with no fake rating", () => {
    expect(formatSheetSubtitle(stats)).toBe("۱۲ نظر · ۴.۳ از ۵");
    const empty = { ...stats, ratingCount: 0, averageRating: 0, recommendCount: 0, notRecommendCount: 0, verifiedBuyerCount: 0 };
    expect(formatSheetSubtitle(empty)).toBe(NO_REVIEWS_TEXT);
    expect(formatSheetSubtitle(empty)).not.toContain("۰ از ۵");
    expect(formatRecommendCount(0)).toBe("۰ نفر توصیه کرده‌اند");
  });

  it("maps a rating to the star fill percentage and clamps out-of-range values", () => {
    expect(ratingToFillPercent(4.3)).toBeCloseTo(86);
    expect(ratingToFillPercent(5)).toBe(100);
    expect(ratingToFillPercent(0)).toBe(0);
    expect(ratingToFillPercent(9)).toBe(100);
    expect(ratingToFillPercent(-1)).toBe(0);
  });
});
