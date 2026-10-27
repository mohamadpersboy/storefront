import { beforeEach, describe, expect, it, vi } from "vitest";

type Variant = { stock: number; isActive: boolean };
const store = new Map<string, Variant>();
const key = (p: unknown, v: unknown) => `${String(p)}:${String(v)}`;

type StockFilter = {
  _id: unknown;
  variants?: { $elemMatch: { _id: unknown; isActive?: boolean; stock: { $gte: number } } };
  "variants._id"?: unknown;
};
type StockUpdate = { $inc: Record<string, number> };

vi.mock("@/models/Product", () => ({
  Product: {
    updateOne: vi.fn(async (filter: StockFilter, update: StockUpdate) => {
      // خواندن شرط، بررسی و کسر در یک مرحله‌ی همگام = معادل یک نوشتن اتمیک
      const em = filter.variants?.$elemMatch;
      const id = em ? em._id : filter["variants._id"];
      const v = store.get(key(filter._id, id));
      if (!v) return { modifiedCount: 0 };
      if (em) {
        if (em.isActive !== undefined && v.isActive !== em.isActive) return { modifiedCount: 0 };
        if (v.stock < em.stock.$gte) return { modifiedCount: 0 };
      }
      v.stock += update.$inc["variants.$.stock"];
      return { modifiedCount: 1 };
    }),
  },
}));

import { reserveStock, releaseStock, StockReservationError } from "@/lib/orders/reserve-stock";

const line = (p: string, v: string, quantity: number) => ({ product: p, variantId: v, title: `T-${p}`, quantity });

beforeEach(() => {
  store.clear();
  store.set(key("p1", "v1"), { stock: 3, isActive: true });
  store.set(key("p2", "v2"), { stock: 5, isActive: true });
});

describe("reserveStock", () => {
  it("decrements stock when enough is available", async () => {
    await reserveStock([line("p1", "v1", 2)]);
    expect(store.get(key("p1", "v1"))!.stock).toBe(1);
  });

  it("buys exactly the last unit", async () => {
    await reserveStock([line("p1", "v1", 3)]);
    expect(store.get(key("p1", "v1"))!.stock).toBe(0);
  });

  it("rejects quantity greater than stock and never goes negative", async () => {
    await expect(reserveStock([line("p1", "v1", 4)])).rejects.toBeInstanceOf(StockReservationError);
    expect(store.get(key("p1", "v1"))!.stock).toBe(3);
  });

  it("10 concurrent single-unit orders for 3 units: exactly 3 succeed, stock is 0", async () => {
    const results = await Promise.allSettled(
      Array.from({ length: 10 }, () => reserveStock([line("p1", "v1", 1)])),
    );
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(3);
    expect(store.get(key("p1", "v1"))!.stock).toBe(0);
  });

  it("multi-line order: a failing line restores the lines already reserved", async () => {
    await expect(
      reserveStock([line("p2", "v2", 2), line("p1", "v1", 99)]),
    ).rejects.toBeInstanceOf(StockReservationError);
    expect(store.get(key("p2", "v2"))!.stock).toBe(5);
    expect(store.get(key("p1", "v1"))!.stock).toBe(3);
  });

  it("rejects a variant that was deactivated", async () => {
    store.get(key("p1", "v1"))!.isActive = false;
    await expect(reserveStock([line("p1", "v1", 1)])).rejects.toBeInstanceOf(StockReservationError);
    expect(store.get(key("p1", "v1"))!.stock).toBe(3);
  });
});

describe("releaseStock", () => {
  it("restores reserved stock once per call", async () => {
    await reserveStock([line("p1", "v1", 2)]);
    await releaseStock([line("p1", "v1", 2)]);
    expect(store.get(key("p1", "v1"))!.stock).toBe(3);
  });
});
