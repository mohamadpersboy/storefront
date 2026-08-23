import { describe, it, expect } from "vitest";
import { computeFinalPrice, hasDiscount } from "@/lib/utils/pricing";

describe("computeFinalPrice", () => {
  it("returns the original price when there is no discount", () => {
    expect(computeFinalPrice(100_000, 0, 0)).toBe(100_000);
  });

  it("applies a percentage discount", () => {
    expect(computeFinalPrice(100_000, 10, 0)).toBe(90_000);
  });

  it("applies a fixed-amount discount", () => {
    expect(computeFinalPrice(100_000, 0, 15_000)).toBe(85_000);
  });

  it("applies both percentage and fixed-amount discounts together", () => {
    // 100,000 - 10% = 90,000; then - 15,000 = 75,000
    expect(computeFinalPrice(100_000, 10, 15_000)).toBe(75_000);
  });

  it("never returns a negative price", () => {
    expect(computeFinalPrice(10_000, 50, 20_000)).toBe(0);
  });

  it("rounds to the nearest whole toman", () => {
    expect(computeFinalPrice(10_000, 33, 0)).toBe(6_700);
  });
});

describe("hasDiscount", () => {
  it("is false when both discount fields are zero", () => {
    expect(hasDiscount(0, 0)).toBe(false);
  });

  it("is true when either discount field is non-zero", () => {
    expect(hasDiscount(10, 0)).toBe(true);
    expect(hasDiscount(0, 5000)).toBe(true);
  });
});
