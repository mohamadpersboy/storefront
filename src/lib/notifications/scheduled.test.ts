import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_NOTIFICATION_CONFIG } from "./config";

const notifExists = vi.fn();
const notifFindOne = vi.fn();
const offerDistinct = vi.fn();
const couponFind = vi.fn();
const redemptionAggregate = vi.fn();
const createNotification = vi.fn();
const createNotifications = vi.fn();

vi.mock("@/models/Notification", () => ({
  Notification: {
    exists: (...a: unknown[]) => notifExists(...a),
    findOne: (...a: unknown[]) => notifFindOne(...a),
  },
}));
vi.mock("@/models/AmazingOffer", () => ({
  AmazingOffer: { distinct: (...a: unknown[]) => offerDistinct(...a) },
}));
vi.mock("@/models/Coupon", () => ({
  Coupon: { find: (...a: unknown[]) => couponFind(...a) },
}));
vi.mock("@/models/CouponRedemption", () => ({
  CouponRedemption: { aggregate: (...a: unknown[]) => redemptionAggregate(...a) },
}));
vi.mock("./service", () => ({
  createNotification: (...a: unknown[]) => createNotification(...a),
  createNotifications: (...a: unknown[]) => createNotifications(...a),
}));

import { runCouponExpiryReminders, runDailySpecialOfferNotification } from "./scheduled";

const cfg = DEFAULT_NOTIFICATION_CONFIG;
const at1030 = new Date("2026-09-29T07:00:00Z"); // 10:30 Tehran
const at0900 = new Date("2026-09-29T05:30:00Z"); // 09:00 Tehran

function chain<T>(value: T) {
  const c: Record<string, unknown> = {};
  for (const m of ["sort", "select", "limit"]) c[m] = () => c;
  c.lean = () => Promise.resolve(value);
  return c;
}

beforeEach(() => {
  for (const f of [notifExists, notifFindOne, offerDistinct, couponFind, redemptionAggregate, createNotification, createNotifications]) f.mockReset();
  notifExists.mockResolvedValue(null);
  notifFindOne.mockReturnValue(chain(null));
  createNotification.mockResolvedValue({ created: true, id: "n1" });
  createNotifications.mockImplementation(async (inputs: unknown[]) => ({ created: inputs.length }));
});

describe("runDailySpecialOfferNotification", () => {
  it("does nothing before the configured local time", async () => {
    await expect(runDailySpecialOfferNotification(at0900, cfg)).resolves.toEqual({ status: "not_due" });
    expect(createNotification).not.toHaveBeenCalled();
  });

  it("does not run twice on the same local day", async () => {
    notifExists.mockResolvedValue({ _id: "x" });
    await expect(runDailySpecialOfferNotification(at1030, cfg)).resolves.toEqual({ status: "already_ran" });
    expect(offerDistinct).not.toHaveBeenCalled();
    expect(notifExists).toHaveBeenCalledWith({ dedupeKey: "daily-special-offer:2026-09-29" });
  });

  it("creates nothing when no new special offers were added", async () => {
    offerDistinct.mockResolvedValue([]);
    await expect(runDailySpecialOfferNotification(at1030, cfg)).resolves.toEqual({ status: "no_new_offers" });
    expect(createNotification).not.toHaveBeenCalled();
  });

  it("counts offers created since the last daily notification", async () => {
    const lastRun = new Date("2026-09-27T06:30:00Z");
    notifFindOne.mockReturnValue(chain({ createdAt: lastRun }));
    offerDistinct.mockResolvedValue(["p1", "p2", "p3"]);

    const result = await runDailySpecialOfferNotification(at1030, cfg);

    expect(result).toEqual({ status: "created", productCount: 3 });
    const filter = offerDistinct.mock.calls[0][1] as { createdAt: { $gt: Date; $lte: Date }; isActive: boolean };
    expect(filter.createdAt.$gt).toEqual(lastRun);
    expect(filter.createdAt.$lte).toEqual(at1030);
    expect(filter.isActive).toBe(true);
    expect(createNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        audience: "public",
        type: "special_offer",
        dedupeKey: "daily-special-offer:2026-09-29",
      }),
    );
  });

  it("falls back to a 24h window on the very first run", async () => {
    offerDistinct.mockResolvedValue(["p1"]);
    await runDailySpecialOfferNotification(at1030, cfg);
    const filter = offerDistinct.mock.calls[0][1] as { createdAt: { $gt: Date } };
    expect(filter.createdAt.$gt).toEqual(new Date(at1030.getTime() - 24 * 3600 * 1000));
  });

  it("reports a duplicate when a concurrent run already created it", async () => {
    offerDistinct.mockResolvedValue(["p1"]);
    createNotification.mockResolvedValue({ created: false, id: null });
    await expect(runDailySpecialOfferNotification(at1030, cfg)).resolves.toEqual({ status: "duplicate" });
  });
});

describe("runCouponExpiryReminders", () => {
  const now = new Date("2026-09-29T07:00:00Z");
  const soon = new Date("2026-09-30T00:00:00Z");
  const coupon = (over: Record<string, unknown> = {}) => ({
    _id: "c1",
    code: "REF1",
    discountPercentage: 10,
    maxDiscountAmount: null,
    minOrderAmount: 0,
    expiresAt: soon,
    usageLimit: 1,
    usedCount: 0,
    perUserLimit: 1,
    allowedUsers: ["u1", "u2"],
    ...over,
  });

  it("queries only active private coupons expiring within the lead time", async () => {
    couponFind.mockReturnValue(chain([]));
    await runCouponExpiryReminders(now, cfg);
    const filter = couponFind.mock.calls[0][0];
    expect(filter).toMatchObject({ type: "private", status: "active" });
    expect(filter.expiresAt.$gt).toEqual(now);
    expect(filter.expiresAt.$lte).toEqual(new Date(now.getTime() + 24 * 3600 * 1000));
  });

  it("creates one reminder per allowed user with a unique dedupeKey", async () => {
    couponFind.mockReturnValue(chain([coupon()]));
    redemptionAggregate.mockResolvedValue([]);
    const result = await runCouponExpiryReminders(now, cfg);
    expect(result).toEqual({ coupons: 1, created: 2 });
    const inputs = createNotifications.mock.calls[0][0] as { dedupeKey: string; userId: string }[];
    expect(inputs.map((i) => i.dedupeKey)).toEqual(["coupon-expiry:c1:u1:24h", "coupon-expiry:c1:u2:24h"]);
  });

  it("skips users who already used the coupon", async () => {
    couponFind.mockReturnValue(chain([coupon({ usageLimit: null })]));
    redemptionAggregate.mockResolvedValue([{ _id: "u1", n: 1 }]);
    await runCouponExpiryReminders(now, cfg);
    const inputs = createNotifications.mock.calls[0][0] as { userId: string }[];
    expect(inputs.map((i) => i.userId)).toEqual(["u2"]);
  });

  it("skips coupons whose total usage limit is exhausted", async () => {
    couponFind.mockReturnValue(chain([coupon({ usedCount: 1 })]));
    await expect(runCouponExpiryReminders(now, cfg)).resolves.toEqual({ coupons: 1, created: 0 });
    expect(createNotifications).not.toHaveBeenCalled();
  });

  it("running twice is safe: duplicates are ignored by the bulk create", async () => {
    couponFind.mockReturnValue(chain([coupon()]));
    redemptionAggregate.mockResolvedValue([]);
    createNotifications.mockResolvedValueOnce({ created: 2 }).mockResolvedValueOnce({ created: 0 });
    expect((await runCouponExpiryReminders(now, cfg)).created).toBe(2);
    expect((await runCouponExpiryReminders(now, cfg)).created).toBe(0);
  });
});
