import { describe, it, expect } from "vitest";
import { validateCouponEligibility, type CouponEligibilityInput } from "@/lib/discounts/validate-coupon";

const NOW = new Date("2026-06-01T00:00:00.000Z");

function baseCoupon(overrides: Partial<CouponEligibilityInput> = {}): CouponEligibilityInput {
  return {
    code: "WELCOME10",
    status: "active",
    type: "public",
    minOrderAmount: 0,
    startsAt: null,
    expiresAt: new Date("2026-12-31T00:00:00.000Z"),
    usageLimit: null,
    usedCount: 0,
    perUserLimit: null,
    allowedUserIds: [],
    ...overrides,
  };
}

function validate(overrides: Partial<CouponEligibilityInput> = {}, extra: Partial<Parameters<typeof validateCouponEligibility>[0]> = {}) {
  return validateCouponEligibility({
    coupon: baseCoupon(overrides),
    userId: "user-1",
    eligibleAmount: 10_000_000,
    usedByUserCount: 0,
    now: NOW,
    ...extra,
  });
}

describe("validateCouponEligibility", () => {
  it("accepts a valid public coupon", () => {
    expect(validate()).toEqual({ valid: true });
  });

  it("rejects an inactive coupon", () => {
    expect(validate({ status: "inactive" })).toEqual({
      valid: false,
      reason: "این کد تخفیف غیرفعال است",
    });
  });

  it("rejects a coupon before its startsAt", () => {
    expect(validate({ startsAt: new Date("2026-07-01T00:00:00.000Z") }).valid).toBe(false);
  });

  it("rejects an expired coupon even if its stored status is 'active'", () => {
    const result = validate({ expiresAt: new Date("2026-01-01T00:00:00.000Z"), status: "active" });
    expect(result).toEqual({ valid: false, reason: "این کد تخفیف منقضی شده است" });
  });

  it("rejects once the usage limit is reached", () => {
    const result = validate({ usageLimit: 10, usedCount: 10 });
    expect(result).toEqual({
      valid: false,
      reason: "ظرفیت استفاده از این کد تخفیف تمام شده است",
    });
  });

  it("accepts right up to (but not over) the usage limit", () => {
    expect(validate({ usageLimit: 10, usedCount: 9 }).valid).toBe(true);
  });

  it("rejects an order below minOrderAmount", () => {
    const result = validate(
      { minOrderAmount: 20_000_000 },
      {},
    );
    expect(result.valid).toBe(false);
  });

  it("accepts a public coupon for any user", () => {
    expect(validate({ type: "public", allowedUserIds: [] }).valid).toBe(true);
  });

  it("accepts a private coupon for an allowed user", () => {
    const result = validate({ type: "private", allowedUserIds: ["user-1", "user-2"] });
    expect(result.valid).toBe(true);
  });

  it("rejects a private coupon for a user not on the allow-list", () => {
    const result = validate({ type: "private", allowedUserIds: ["user-2"] });
    expect(result).toEqual({
      valid: false,
      reason: "این کد تخفیف برای شما قابل استفاده نیست",
    });
  });

  it("rejects once a user has hit their per-user limit", () => {
    const result = validate({ perUserLimit: 1 }, { usedByUserCount: 1 });
    expect(result).toEqual({
      valid: false,
      reason: "شما قبلاً از این کد تخفیف استفاده کرده‌اید",
    });
  });

  it("allows a different user to still use a coupon another user has exhausted", () => {
    const result = validate({ perUserLimit: 1 }, { usedByUserCount: 0 });
    expect(result.valid).toBe(true);
  });
});
