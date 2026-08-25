import { describe, it, expect } from "vitest";
import {
  computeFinalPrice,
  hasDiscount,
  computePrepayment,
  computeRemainingOnlineAmount,
} from "@/lib/utils/pricing";

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

describe("computePrepayment", () => {
  it("is 100% for 'online' regardless of the requested split percent", () => {
    const result = computePrepayment("online", 1_000_000, 10);
    expect(result).toEqual({
      prepaymentPercent: 100,
      prepaymentAmount: 1_000_000,
      remainingAmount: 0,
    });
  });

  it("is 0% for 'cash' regardless of the requested split percent", () => {
    const result = computePrepayment("cash", 1_000_000, 50);
    expect(result).toEqual({
      prepaymentPercent: 0,
      prepaymentAmount: 0,
      remainingAmount: 1_000_000,
    });
  });

  it("uses the given percent for 'split'", () => {
    const result = computePrepayment("split", 1_000_000, 10);
    expect(result).toEqual({
      prepaymentPercent: 10,
      prepaymentAmount: 100_000,
      remainingAmount: 900_000,
    });
  });

  it("clamps an out-of-range split percent into 0-100", () => {
    expect(computePrepayment("split", 1_000_000, 150).prepaymentPercent).toBe(100);
    expect(computePrepayment("split", 1_000_000, -20).prepaymentPercent).toBe(0);
  });

  it("defaults split percent to 0 when not provided", () => {
    const result = computePrepayment("split", 1_000_000);
    expect(result.prepaymentPercent).toBe(0);
  });
});

describe("computeRemainingOnlineAmount", () => {
  it("subtracts what's already paid from the online portion owed", () => {
    expect(computeRemainingOnlineAmount(500_000, 200_000)).toBe(300_000);
  });

  it("returns 0 once fully paid, never negative", () => {
    expect(computeRemainingOnlineAmount(500_000, 500_000)).toBe(0);
    expect(computeRemainingOnlineAmount(500_000, 600_000)).toBe(0);
  });
});
