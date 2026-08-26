import { describe, it, expect } from "vitest";
import {
  computeCouponDiscount,
  computePaymentReward,
  resolveOrderDiscount,
  type PaymentRewardSettings,
} from "@/lib/discounts/engine";

describe("computeCouponDiscount", () => {
  it("applies a plain percentage with no cap", () => {
    expect(computeCouponDiscount(10_000_000, 10, null)).toBe(1_000_000);
  });

  it("caps the discount at maxDiscountAmount (§25 example)", () => {
    expect(computeCouponDiscount(20_000_000, 10, 1_000_000)).toBe(1_000_000);
  });

  it("does not cap when the raw discount is already under the max", () => {
    expect(computeCouponDiscount(5_000_000, 10, 1_000_000)).toBe(500_000);
  });
});

const disabledRewards: PaymentRewardSettings = {
  onlinePaymentRewardEnabled: false,
  onlinePaymentRewardPercentage: 0,
  mixedPaymentRewardEnabled: false,
  mixedPaymentRewardPercentage: 0,
};

describe("computePaymentReward", () => {
  it("returns null when the feature is disabled", () => {
    expect(computePaymentReward("online", 10_000_000, disabledRewards)).toBeNull();
  });

  it("computes the online reward when enabled and method is 'online' (§36 example)", () => {
    const settings = { ...disabledRewards, onlinePaymentRewardEnabled: true, onlinePaymentRewardPercentage: 5 };
    expect(computePaymentReward("online", 10_000_000, settings)).toEqual({
      amount: 500_000,
      percentage: 5,
      rewardType: "online",
    });
  });

  it("computes the mixed reward when enabled and method is 'split' (§37 example)", () => {
    const settings = { ...disabledRewards, mixedPaymentRewardEnabled: true, mixedPaymentRewardPercentage: 3 };
    expect(computePaymentReward("split", 10_000_000, settings)).toEqual({
      amount: 300_000,
      percentage: 3,
      rewardType: "mixed",
    });
  });

  it("never applies a reward to 'cash' orders regardless of settings", () => {
    const settings = {
      onlinePaymentRewardEnabled: true,
      onlinePaymentRewardPercentage: 10,
      mixedPaymentRewardEnabled: true,
      mixedPaymentRewardPercentage: 10,
    };
    expect(computePaymentReward("cash", 10_000_000, settings)).toBeNull();
  });

  it("does not apply the online reward to a 'split' order or vice versa", () => {
    const onlineOnly = { ...disabledRewards, onlinePaymentRewardEnabled: true, onlinePaymentRewardPercentage: 5 };
    expect(computePaymentReward("split", 10_000_000, onlineOnly)).toBeNull();

    const mixedOnly = { ...disabledRewards, mixedPaymentRewardEnabled: true, mixedPaymentRewardPercentage: 3 };
    expect(computePaymentReward("online", 10_000_000, mixedOnly)).toBeNull();
  });
});

describe("resolveOrderDiscount (§41 mutual-exclusion policy)", () => {
  const rewardSettings = {
    onlinePaymentRewardEnabled: true,
    onlinePaymentRewardPercentage: 5,
    mixedPaymentRewardEnabled: true,
    mixedPaymentRewardPercentage: 3,
  };

  it("applies the coupon and skips the reward, even though the reward would also qualify", () => {
    const result = resolveOrderDiscount({
      eligibleAmount: 10_000_000,
      paymentMethod: "online",
      appliedCoupon: { id: "c1", code: "WELCOME10", discountPercentage: 10, maxDiscountAmount: null },
      rewardSettings,
    });
    expect(result).toEqual({
      source: "coupon",
      amount: 1_000_000,
      couponId: "c1",
      couponCode: "WELCOME10",
      discountPercentage: 10,
    });
  });

  it("falls back to the automatic reward when no coupon is applied", () => {
    const result = resolveOrderDiscount({
      eligibleAmount: 10_000_000,
      paymentMethod: "online",
      appliedCoupon: null,
      rewardSettings,
    });
    expect(result).toEqual({
      source: "payment_reward",
      amount: 500_000,
      rewardType: "online",
      discountPercentage: 5,
    });
  });

  it("applies neither when there's no coupon and no qualifying reward", () => {
    const result = resolveOrderDiscount({
      eligibleAmount: 10_000_000,
      paymentMethod: "cash",
      appliedCoupon: null,
      rewardSettings,
    });
    expect(result).toEqual({ source: null, amount: 0 });
  });
});
