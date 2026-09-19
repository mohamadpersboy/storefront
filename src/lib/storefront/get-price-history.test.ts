import { describe, expect, it } from "vitest";
import { getMockWeeklyPriceHistory } from "./get-price-history";

describe("getMockWeeklyPriceHistory", () => {
  it("returns exactly 8 weekly points", () => {
    const result = getMockWeeklyPriceHistory("product-1", 1_000_000);
    expect(result).toHaveLength(8);
  });

  it("ends with the exact current price for the last (current) week", () => {
    const result = getMockWeeklyPriceHistory("product-1", 1_234_000);
    expect(result[result.length - 1].price).toBe(1_234_000);
  });

  it("gives every point a non-empty label and a positive numeric price", () => {
    const result = getMockWeeklyPriceHistory("product-1", 900_000);
    for (const point of result) {
      expect(typeof point.weekLabel).toBe("string");
      expect(point.weekLabel.length).toBeGreaterThan(0);
      expect(point.price).toBeGreaterThan(0);
    }
  });

  it("is deterministic for the same productId and price", () => {
    const first = getMockWeeklyPriceHistory("product-42", 2_000_000);
    const second = getMockWeeklyPriceHistory("product-42", 2_000_000);
    expect(first).toEqual(second);
  });

  it("produces a different fluctuation pattern for a different productId", () => {
    const a = getMockWeeklyPriceHistory("product-a", 2_000_000);
    const b = getMockWeeklyPriceHistory("product-b", 2_000_000);
    // هفته جاری (آخرین Index) همیشه برابر است؛ بقیه معمولاً فرق دارند.
    const earlierWeeksA = a.slice(0, -1).map((p) => p.price);
    const earlierWeeksB = b.slice(0, -1).map((p) => p.price);
    expect(earlierWeeksA).not.toEqual(earlierWeeksB);
  });

  it("keeps every earlier week's price within the fluctuation bound of the current price", () => {
    const currentPrice = 5_000_000;
    const result = getMockWeeklyPriceHistory("product-99", currentPrice);
    for (const point of result.slice(0, -1)) {
      expect(point.price).toBeGreaterThan(currentPrice * 0.9);
      expect(point.price).toBeLessThan(currentPrice * 1.1);
    }
  });
});
