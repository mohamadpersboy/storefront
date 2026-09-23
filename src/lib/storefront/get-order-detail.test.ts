import { describe, expect, it } from "vitest";
import { formatOrderDiscountLabel } from "@/lib/storefront/get-order-detail";
import type { IOrderDiscount } from "@/models/Order";

describe("formatOrderDiscountLabel", () => {
  it("formats a coupon discount with its code", () => {
    const discount: IOrderDiscount = {
      source: "coupon",
      amount: 50000,
      discountPercentage: 10,
      coupon: null,
      couponCode: "SUMMER10",
      rewardType: null,
    };
    expect(formatOrderDiscountLabel(discount)).toBe("تخفیف کد SUMMER10");
  });

  it("formats an online payment reward", () => {
    const discount: IOrderDiscount = {
      source: "payment_reward",
      amount: 20000,
      discountPercentage: 5,
      coupon: null,
      couponCode: null,
      rewardType: "online",
    };
    expect(formatOrderDiscountLabel(discount)).toBe("پاداش پرداخت آنلاین");
  });

  it("formats a mixed (split) payment reward", () => {
    const discount: IOrderDiscount = {
      source: "payment_reward",
      amount: 20000,
      discountPercentage: 5,
      coupon: null,
      couponCode: null,
      rewardType: "mixed",
    };
    expect(formatOrderDiscountLabel(discount)).toBe("پاداش پرداخت ترکیبی");
  });
});
