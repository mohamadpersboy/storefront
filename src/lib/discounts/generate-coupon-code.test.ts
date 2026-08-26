import { describe, it, expect } from "vitest";
import { generateCandidateCouponCode } from "@/lib/discounts/generate-coupon-code";

const CODE_PATTERN = /^[A-Za-z0-9_-]+$/;

describe("generateCandidateCouponCode", () => {
  it("always produces a code matching the Coupon code format", () => {
    for (let i = 0; i < 50; i++) {
      const code = generateCandidateCouponCode(10, () => Math.random());
      expect(code).toMatch(CODE_PATTERN);
      expect(code.length).toBeGreaterThanOrEqual(4);
      expect(code.length).toBeLessThanOrEqual(30);
    }
  });

  it("is deterministic for a fixed rand function", () => {
    const fixedRand = () => 0; // always picks the first item / digit 0
    const a = generateCandidateCouponCode(10, fixedRand);
    const b = generateCandidateCouponCode(10, fixedRand);
    expect(a).toBe(b);
  });

  it("can incorporate a valid discount percentage into the suggestion", () => {
    // rand() = 0 -> first theme, first pattern (which uses the percentage)
    const code = generateCandidateCouponCode(15, () => 0);
    expect(code).toContain("15");
  });

  it("falls back to random digits when the percentage is out of range", () => {
    const code = generateCandidateCouponCode(150, () => 0);
    expect(code).not.toContain("150");
  });
});
