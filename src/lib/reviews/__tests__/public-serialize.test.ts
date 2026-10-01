import { describe, expect, it } from "vitest";
import {
  toPublicDisplayName,
  toPublicReviewDTO,
  toPublicReviewStats,
} from "@/lib/reviews/public-serialize";

describe("toPublicDisplayName", () => {
  it("abbreviates the last name: «محمد رضایی» → «محمد ر.»", () => {
    expect(toPublicDisplayName("محمد رضایی")).toBe("محمد ر.");
  });

  it("uses the first name and the initial of the last part for 3+ words", () => {
    expect(toPublicDisplayName("محمد رضا رضایی")).toBe("محمد ر.");
  });

  it("keeps a single-word name and trims extra whitespace", () => {
    expect(toPublicDisplayName("  علی  ")).toBe("علی");
    expect(toPublicDisplayName("  علی    کریمی ")).toBe("علی ک.");
  });

  it("falls back to «کاربر» for missing, empty or non-letter names", () => {
    expect(toPublicDisplayName(undefined)).toBe("کاربر");
    expect(toPublicDisplayName(null)).toBe("کاربر");
    expect(toPublicDisplayName("")).toBe("کاربر");
    expect(toPublicDisplayName("   ")).toBe("کاربر");
    expect(toPublicDisplayName("09123456789")).toBe("کاربر");
    expect(toPublicDisplayName("۰۹۱۲۳۴۵۶۷۸۹")).toBe("کاربر");
  });

  it("never exposes a phone number even if it is part of the name", () => {
    expect(toPublicDisplayName("09123456789 رضایی")).not.toContain("0912");
  });
});

describe("toPublicReviewDTO", () => {
  const doc = {
    // فیلدهای داخلی که نباید به Client برسند
    _id: "r1",
    user: "u1",
    product: "p1",
    order: "o1",
    status: "approved",
    moderatedBy: "m1",
    moderatedAt: new Date(),
    rejectionReason: "x",
    deletedAt: null,
    rating: 4,
    text: "خوب بود",
    recommendation: "recommend" as const,
    isVerifiedBuyer: true,
    images: [{ url: "https://res.cloudinary.com/x/a.jpg", publicId: "secret/a", width: 600, height: 800 }],
    createdAt: new Date("2026-09-30T10:00:00Z"),
  };

  it("exposes only the public fields", () => {
    const dto = toPublicReviewDTO(doc, "محمد رضایی");
    expect(Object.keys(dto).sort()).toEqual(
      ["createdAt", "displayName", "images", "isVerifiedBuyer", "rating", "recommendation", "text"].sort(),
    );
    expect(dto).toMatchObject({
      displayName: "محمد ر.",
      rating: 4,
      recommendation: "recommend",
      text: "خوب بود",
      isVerifiedBuyer: true,
      createdAt: "2026-09-30T10:00:00.000Z",
    });
  });

  it("strips publicId from images and keeps url + dimensions", () => {
    const dto = toPublicReviewDTO(doc, "x");
    expect(dto.images).toEqual([{ url: "https://res.cloudinary.com/x/a.jpg", width: 600, height: 800 }]);
    const json = JSON.stringify(dto);
    for (const leak of ["secret/a", "u1", "o1", "m1", "rejectionReason", "deletedAt", "status"]) {
      expect(json).not.toContain(leak);
    }
  });

  it("handles not_recommend, non-buyer and missing images", () => {
    const dto = toPublicReviewDTO(
      { rating: 2, text: "t", recommendation: "not_recommend", createdAt: "2026-01-01T00:00:00Z" },
      undefined,
    );
    expect(dto).toMatchObject({
      displayName: "کاربر",
      recommendation: "not_recommend",
      isVerifiedBuyer: false,
      images: [],
    });
  });
});

describe("toPublicReviewStats", () => {
  it("derives notRecommendCount from ratingCount − recommendCount", () => {
    expect(
      toPublicReviewStats({ averageRating: 4.3, ratingCount: 12, recommendCount: 10, verifiedBuyerCount: 8 }),
    ).toEqual({ averageRating: 4.3, ratingCount: 12, recommendCount: 10, notRecommendCount: 2, verifiedBuyerCount: 8 });
  });

  it("is all zero for no reviews", () => {
    expect(
      toPublicReviewStats({ averageRating: 0, ratingCount: 0, recommendCount: 0, verifiedBuyerCount: 0 }),
    ).toMatchObject({ ratingCount: 0, notRecommendCount: 0 });
  });
});
