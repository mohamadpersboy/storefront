import { beforeEach, describe, expect, it, vi } from "vitest";

type Doc = Record<string, unknown>;
const topups = new Map<string, Doc>();
const credits = new Set<string>();
const verify = vi.fn();
const claimed = vi.fn();

const q = <T,>(get: () => T) => {
  const o = { select: () => o, lean: async () => get(), then: (r: (v: T) => unknown) => Promise.resolve(get()).then(r) };
  return o;
};

vi.mock("@/models/WalletTopup", () => ({
  WalletTopup: {
    findOne: ({ authority }: { authority: string }) => q(() => [...topups.values()].find((t) => t.authority === authority) ?? null),
    findById: (id: string) => q(() => topups.get(id) ?? null),
    findOneAndUpdate: (f: Doc, u: { $set: Doc }) => {
      claimed(u.$set.status);
      const t = topups.get(String(f._id));
      if (t) Object.assign(t, u.$set);
      return q(() => t ?? null);
    },
  },
}));
vi.mock("@/lib/payment/gateways/sepehr-gateway", () => ({
  sepehrGateway: {
    id: "sepehr",
    verifyPayment: (...a: unknown[]) => verify(...a),
    extractReceipt: (d?: Record<string, string>) => d?.digitalreceipt ?? null,
  },
}));
vi.mock("@/lib/payment/digital-receipt", () => ({ isDigitalReceiptUsed: async () => false }));
vi.mock("@/lib/db/transaction", () => ({ runInTransaction: (fn: (s: null) => unknown) => fn(null) }));
vi.mock("@/lib/wallet/wallet-service", () => ({
  adjustWalletBalance: async (p: { idempotencyKey: string }) => void credits.add(p.idempotencyKey),
}));

import { processTopupCallback } from "@/lib/wallet/process-topup-callback";

const INV = "d".repeat(32);
const DATA = { invoiceid: INV, digitalreceipt: "rcpt-0123456789", respcode: "0" };
const seed = (over: Doc = {}) =>
  topups.set("t1", { _id: "t1", user: "u1", amount: 5000, authority: INV, status: "pending", provider: "sepehr", ...over });

beforeEach(() => {
  topups.clear();
  credits.clear();
  verify.mockReset();
  claimed.mockReset();
});

describe("processTopupCallback with Sepehr", () => {
  it("credits wallet once; replay has no second credit or Advice", async () => {
    seed();
    verify.mockResolvedValue({ success: true, refId: 9, cardPan: null, digitalReceipt: "rcpt-0123456789" });
    const run = () => processTopupCallback({ authority: INV, gateway: "sepehr", callbackData: DATA });
    expect(await run()).toMatchObject({ outcome: "success" });
    expect(await run()).toMatchObject({ outcome: "success" });
    expect(verify).toHaveBeenCalledTimes(1);
    expect([...credits]).toEqual(["topup-credit:t1"]);
    expect(topups.get("t1")).toMatchObject({ status: "paid", digitalReceipt: "rcpt-0123456789" });
  });

  it("Cron call without callback data: stays pending, no claim, no Advice", async () => {
    seed();
    expect(await processTopupCallback({ authority: INV })).toMatchObject({ outcome: "pending" });
    expect(claimed).not.toHaveBeenCalled();
    expect(verify).not.toHaveBeenCalled();
  });

  it("gateway that does not match the record provider is rejected", async () => {
    seed();
    expect(await processTopupCallback({ authority: INV, gateway: "zarinpal", callbackData: DATA })).toEqual({ outcome: "error" });
    expect(verify).not.toHaveBeenCalled();
  });

  it("user cancel: top-up failed, no credit", async () => {
    seed();
    verify.mockResolvedValue({ success: false, code: -1, message: "لغو", retryable: false, unconfirmed: false });
    expect(await processTopupCallback({ authority: INV, gateway: "sepehr", callbackData: { ...DATA, respcode: "-1" } })).toMatchObject({ outcome: "failed" });
    expect(credits.size).toBe(0);
  });

  it("unconfirmed Advice code: pending + manual review", async () => {
    seed();
    verify.mockResolvedValue({ success: false, code: -7, message: "x", retryable: false, unconfirmed: true });
    expect(await processTopupCallback({ authority: INV, gateway: "sepehr", callbackData: DATA })).toMatchObject({ outcome: "pending", manualReview: true });
    expect(topups.get("t1")).toMatchObject({ status: "pending", needsManualReview: true });
  });
});
