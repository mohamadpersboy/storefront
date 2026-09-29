import { beforeEach, describe, expect, it, vi } from "vitest";

const safeCreate = vi.fn();
const safeCreateMany = vi.fn();
vi.mock("./service", () => ({
  safeCreateNotification: (...a: unknown[]) => safeCreate(...a),
  safeCreateNotifications: (...a: unknown[]) => safeCreateMany(...a),
}));

import {
  notifyCouponCreated,
  notifyOrderCreated,
  notifyOrderStatusChanged,
  notifyPaymentResult,
  notifyReferralFirstPurchase,
  notifyReferralReward,
  notifyReferralSignup,
} from "./events";

const now = new Date("2026-09-29T10:00:00Z");
const coupon = (over = {}) => ({
  id: "c1",
  code: "SUMMER20",
  discountPercentage: 20,
  maxDiscountAmount: null,
  minOrderAmount: 0,
  startsAt: null,
  expiresAt: new Date("2026-10-30T00:00:00Z"),
  type: "public" as const,
  status: "active" as const,
  allowedUsers: [] as string[],
  ...over,
});

beforeEach(() => {
  safeCreate.mockReset();
  safeCreateMany.mockReset();
});

describe("coupon notifications", () => {
  it("public active coupon → one public notification with a coupon snapshot", async () => {
    await notifyCouponCreated(coupon(), now);
    const n = safeCreate.mock.calls[0][0];
    expect(n).toMatchObject({
      audience: "public",
      type: "coupon",
      ref: { kind: "coupon", id: "c1" },
      dedupeKey: "coupon-public:c1",
      expiresAt: new Date("2026-10-30T00:00:00Z"),
    });
    expect(n.content).toContain("SUMMER20");
    expect(n.publishAt).toEqual(now);
  });

  it("a coupon that starts later is published at its start time", async () => {
    const startsAt = new Date("2026-10-05T00:00:00Z");
    await notifyCouponCreated(coupon({ startsAt }), now);
    expect(safeCreate.mock.calls[0][0].publishAt).toEqual(startsAt);
  });

  it("private coupon → one personal notification per allowed user", async () => {
    await notifyCouponCreated(coupon({ type: "private", allowedUsers: ["u1", "u2"] }), now);
    expect(safeCreate).not.toHaveBeenCalled();
    const list = safeCreateMany.mock.calls[0][0];
    expect(list).toHaveLength(2);
    expect(list[0]).toMatchObject({ audience: "user", userId: "u1", dedupeKey: "coupon-personal:c1:u1" });
    expect(list[1].dedupeKey).toBe("coupon-personal:c1:u2");
  });

  it("inactive or already-expired coupons never notify", async () => {
    await notifyCouponCreated(coupon({ status: "inactive" }), now);
    await notifyCouponCreated(coupon({ expiresAt: new Date("2026-09-01T00:00:00Z") }), now);
    expect(safeCreate).not.toHaveBeenCalled();
    expect(safeCreateMany).not.toHaveBeenCalled();
  });
});

describe("order notifications", () => {
  it("order created links to the order and is keyed by order id", async () => {
    await notifyOrderCreated({ orderId: "o1", orderNumber: 1001, customerId: "u1" });
    expect(safeCreate.mock.calls[0][0]).toMatchObject({
      audience: "user",
      userId: "u1",
      type: "order",
      link: "/orders/o1",
      dedupeKey: "order-created:o1",
    });
  });

  it("status change is keyed by (order, status) so it cannot duplicate", async () => {
    await notifyOrderStatusChanged({ orderId: "o1", orderNumber: 1001, customerId: "u1", status: "shipped" });
    expect(safeCreate.mock.calls[0][0].dedupeKey).toBe("order-status:o1:shipped");
  });

  it("does not create a notification for the pending status", async () => {
    await notifyOrderStatusChanged({ orderId: "o1", orderNumber: 1, customerId: "u1", status: "pending" });
    expect(safeCreate).not.toHaveBeenCalled();
  });

  it("payment success and failure use different keys", async () => {
    await notifyPaymentResult({ paymentId: "p1", orderId: "o1", orderNumber: 1, customerId: "u1", success: true });
    await notifyPaymentResult({ paymentId: "p1", orderId: "o1", orderNumber: 1, customerId: "u1", success: false });
    expect(safeCreate.mock.calls.map((c) => c[0].dedupeKey)).toEqual(["payment-success:p1", "payment-failed:p1"]);
  });
});

describe("referral notifications", () => {
  it("signup, first purchase and reward go to the referrer, once per referral", async () => {
    await notifyReferralSignup({ referralId: "r1", referrerId: "u9" });
    await notifyReferralFirstPurchase({ referralId: "r1", referrerId: "u9" });
    await notifyReferralReward({
      referralId: "r1",
      referrerId: "u9",
      coupon: { code: "REF-1", discountPercentage: 10, maxDiscountAmount: null, minOrderAmount: 0, expiresAt: new Date("2026-11-01T00:00:00Z") },
    });
    const calls = safeCreate.mock.calls.map((c) => c[0]);
    expect(calls.every((c) => c.userId === "u9" && c.type === "referral")).toBe(true);
    expect(calls.map((c) => c.dedupeKey)).toEqual([
      "referral-signup:r1",
      "referral-first-purchase:r1",
      "referral-reward:r1",
    ]);
    expect(calls[2].content).toContain("REF-1");
  });
});
