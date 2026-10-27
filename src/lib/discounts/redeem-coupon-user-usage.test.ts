import { beforeEach, describe, expect, it, vi } from "vitest";

const rows = new Map<string, { count: number }>();
const k = (f: Record<string, unknown>) => `${String(f.coupon)}:${String(f.user)}`;

vi.mock("@/models/Coupon", () => ({ Coupon: {} }));
vi.mock("@/models/CouponRedemption", () => ({ CouponRedemption: {} }));
vi.mock("@/models/CouponUserUsage", () => ({
  CouponUserUsage: {
    findOneAndUpdate: vi.fn(async (f: { coupon: unknown; user: unknown; count: { $lt: number } }) => {
      const r = rows.get(k(f));
      if (!r || !(r.count < f.count.$lt)) return null;
      r.count += 1;
      return { ...r };
    }),
    exists: vi.fn(async (f: Record<string, unknown>) => (rows.has(k(f)) ? { _id: 1 } : null)),
    create: vi.fn(async (d: { coupon: unknown; user: unknown; count: number }) => {
      // اینجا بین Promiseها یک وقفه می‌اندازیم تا ساخت هم‌زمان شبیه‌سازی شود
      await Promise.resolve();
      if (rows.has(k(d))) throw Object.assign(new Error("dup"), { code: 11000 });
      rows.set(k(d), { count: d.count });
      return d;
    }),
    updateOne: vi.fn(async (f: { coupon: unknown; user: unknown }, u: { $inc: { count: number } }) => {
      const r = rows.get(k(f));
      if (r && r.count > 0) r.count += u.$inc.count;
    }),
  },
}));

import {
  reserveCouponUserUsage,
  releaseCouponUserUsage,
  CouponRedemptionError,
} from "@/lib/discounts/redeem-coupon";

const base = { couponId: "c1", userId: "u1" };

beforeEach(() => rows.clear());

describe("reserveCouponUserUsage", () => {
  it("does nothing when there is no per-user limit", async () => {
    await reserveCouponUserUsage({ ...base, perUserLimit: null, usedBefore: 0 });
    expect(rows.size).toBe(0);
  });

  it("8 concurrent reservations with limit 1: exactly one succeeds", async () => {
    const results = await Promise.allSettled(
      Array.from({ length: 8 }, () => reserveCouponUserUsage({ ...base, perUserLimit: 1, usedBefore: 0 })),
    );
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    const rejected = results.filter((r) => r.status === "rejected") as PromiseRejectedResult[];
    expect(rejected.every((r) => r.reason instanceof CouponRedemptionError)).toBe(true);
    expect(rows.get("c1:u1")!.count).toBe(1);
  });

  it("limit 3 with 8 concurrent: exactly three succeed and the counter is 3", async () => {
    const results = await Promise.allSettled(
      Array.from({ length: 8 }, () => reserveCouponUserUsage({ ...base, perUserLimit: 3, usedBefore: 0 })),
    );
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(3);
    expect(rows.get("c1:u1")!.count).toBe(3);
  });

  it("seeds a new counter from earlier redemptions", async () => {
    await reserveCouponUserUsage({ ...base, perUserLimit: 2, usedBefore: 1 });
    expect(rows.get("c1:u1")!.count).toBe(2);
    await expect(
      reserveCouponUserUsage({ ...base, perUserLimit: 2, usedBefore: 1 }),
    ).rejects.toBeInstanceOf(CouponRedemptionError);
  });

  it("rejects when earlier redemptions already reached the limit", async () => {
    await expect(
      reserveCouponUserUsage({ ...base, perUserLimit: 1, usedBefore: 1 }),
    ).rejects.toBeInstanceOf(CouponRedemptionError);
    expect(rows.size).toBe(0);
  });

  it("different users do not affect each other", async () => {
    await reserveCouponUserUsage({ couponId: "c1", userId: "u1", perUserLimit: 1, usedBefore: 0 });
    await reserveCouponUserUsage({ couponId: "c1", userId: "u2", perUserLimit: 1, usedBefore: 0 });
    expect(rows.get("c1:u1")!.count).toBe(1);
    expect(rows.get("c1:u2")!.count).toBe(1);
  });
});

describe("releaseCouponUserUsage", () => {
  it("frees the slot so the user can reserve again, and never goes below zero", async () => {
    await reserveCouponUserUsage({ ...base, perUserLimit: 1, usedBefore: 0 });
    await releaseCouponUserUsage({ ...base, perUserLimit: 1 });
    expect(rows.get("c1:u1")!.count).toBe(0);
    await releaseCouponUserUsage({ ...base, perUserLimit: 1 });
    expect(rows.get("c1:u1")!.count).toBe(0);
    await reserveCouponUserUsage({ ...base, perUserLimit: 1, usedBefore: 0 });
    expect(rows.get("c1:u1")!.count).toBe(1);
  });
});
