import { describe, expect, it } from "vitest";
import { dedupeKeys } from "./dedupe";
import {
  couponExpiryReminderText,
  dailySpecialOfferText,
  orderStatusText,
  personalCouponText,
  publicCouponText,
} from "./templates";

const coupon = {
  code: "SUMMER20",
  discountPercentage: 20,
  maxDiscountAmount: 500000,
  minOrderAmount: 1000000,
  expiresAt: new Date("2026-10-15T00:00:00Z"),
};

describe("notification templates", () => {
  it("has no message for the pending status (never a transition target)", () => {
    expect(orderStatusText("pending", 1001)).toBeNull();
  });

  it.each(["confirmed", "processing", "ready_to_ship", "shipped", "delivered", "cancelled", "returned"] as const)(
    "has a message for real status %s",
    (status) => {
      const text = orderStatusText(status, 1001);
      expect(text?.title).toBeTruthy();
      expect(text?.content).toContain("۱۰۰۱");
    },
  );

  it("coupon snapshot text includes code, percent, cap, minimum and expiry", () => {
    const { title, content } = publicCouponText(coupon);
    expect(title).toContain("۲۰");
    expect(content).toContain("SUMMER20");
    expect(content).toContain("حداکثر");
    expect(content).toContain("حداقل مبلغ سفارش");
    expect(content).toContain("اعتبار تا");
    expect(personalCouponText(coupon).title).toContain("اختصاصی");
  });

  it("omits cap and minimum lines when not set", () => {
    const { content } = publicCouponText({ ...coupon, maxDiscountAmount: null, minOrderAmount: 0 });
    expect(content).not.toContain("حداکثر");
    expect(content).not.toContain("حداقل مبلغ سفارش");
  });

  it("expiry reminder mentions 24 hours for the default lead time", () => {
    expect(couponExpiryReminderText(coupon, 24).title).toContain("۲۴ ساعت");
  });

  it("daily special offer uses Persian digits", () => {
    expect(dailySpecialOfferText(10).title).toContain("۱۰");
  });
});

describe("dedupeKeys", () => {
  it("are deterministic and distinct per subject", () => {
    expect(dedupeKeys.couponExpiry("c1", "u1", 24)).toBe("coupon-expiry:c1:u1:24h");
    expect(dedupeKeys.couponExpiry("c1", "u2", 24)).not.toBe(dedupeKeys.couponExpiry("c1", "u1", 24));
    expect(dedupeKeys.orderStatus("o1", "shipped")).not.toBe(dedupeKeys.orderStatus("o1", "delivered"));
    expect(dedupeKeys.dailySpecialOffer("2026-09-29")).toBe("daily-special-offer:2026-09-29");
  });
});
