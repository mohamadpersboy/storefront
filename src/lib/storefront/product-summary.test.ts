import { describe, expect, it } from "vitest";
import { buildPublicProductSummary } from "./product-summary";

function product(overrides: Partial<Parameters<typeof buildPublicProductSummary>[0]> = {}) {
  return {
    _id: "p1",
    title: "فرش ۱۲۰۰ شانه",
    slug: "carpet-1200",
    category: { _id: "c1", name: "فرش ماشینی", slug: "machine-made" },
    images: [{ url: "https://example.com/a.jpg" }],
    variants: [
      { price: 1_000_000, discountPercent: 0, discountAmount: 0, stock: 5 },
    ],
    createdAt: new Date("2026-01-01"),
    ...overrides,
  };
}

describe("buildPublicProductSummary", () => {
  it("returns the cheapest final price and its original price across variants", () => {
    const summary = buildPublicProductSummary(
      product({
        variants: [
          { price: 2_000_000, discountPercent: 0, discountAmount: 0, stock: 2 },
          { price: 1_000_000, discountPercent: 10, discountAmount: 0, stock: 3 },
        ],
      }),
    );
    // 1,000,000 - 10% = 900,000 is cheaper than the untouched 2,000,000
    expect(summary.minPrice).toBe(900_000);
    expect(summary.originalPrice).toBe(1_000_000);
  });

  it("computes the maximum effective discount percent across variants", () => {
    const summary = buildPublicProductSummary(
      product({
        variants: [
          { price: 1_000_000, discountPercent: 10, discountAmount: 0, stock: 1 },
          { price: 1_000_000, discountPercent: 0, discountAmount: 500_000, stock: 1 },
        ],
      }),
    );
    expect(summary.maxDiscountPercent).toBe(50);
  });

  it("returns zero discount for a product with no discounted variants", () => {
    const summary = buildPublicProductSummary(product());
    expect(summary.maxDiscountPercent).toBe(0);
  });

  it("sums stock across all variants", () => {
    const summary = buildPublicProductSummary(
      product({
        variants: [
          { price: 1_000_000, discountPercent: 0, discountAmount: 0, stock: 4 },
          { price: 1_000_000, discountPercent: 0, discountAmount: 0, stock: 6 },
        ],
      }),
    );
    expect(summary.totalStock).toBe(10);
  });

  it("resolves a populated category reference", () => {
    const summary = buildPublicProductSummary(product());
    expect(summary.category).toEqual({
      id: "c1",
      name: "فرش ماشینی",
      slug: "machine-made",
    });
  });

  it("returns null category when it is not populated (still an ObjectId)", () => {
    const summary = buildPublicProductSummary(product({ category: "c1" }));
    expect(summary.category).toBeNull();
  });

  it("returns null cover image and zero price for a product with no images/variants", () => {
    const summary = buildPublicProductSummary(product({ images: [], variants: [] }));
    expect(summary.coverImage).toBeNull();
    expect(summary.minPrice).toBe(0);
    expect(summary.totalStock).toBe(0);
  });
});
