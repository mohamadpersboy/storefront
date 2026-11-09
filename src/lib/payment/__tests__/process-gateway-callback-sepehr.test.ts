import { beforeEach, describe, expect, it, vi } from "vitest";

type Doc = Record<string, unknown>;
const payments = new Map<string, Doc>();
const refunds = new Set<string>();
let walletCredits = 0;
const verify = vi.fn();
const receiptUsed = vi.fn();

const chain = <T,>(get: () => T) => {
  const q = {
    select: () => q,
    lean: () => q,
    then: (res: (v: T) => unknown, rej?: (e: unknown) => unknown) => Promise.resolve().then(get).then(res, rej),
  };
  return q;
};
const matches = (doc: Doc, f: Doc): boolean =>
  Object.entries(f).every(([k, c]) => {
    if (k === "$or") return (c as Doc[]).some((x) => matches(doc, x));
    if (c && typeof c === "object" && !(c instanceof Date)) {
      const o = c as Doc;
      if ("$lt" in o) return doc[k] != null && (doc[k] as Date) < (o.$lt as Date);
      if ("$ne" in o) return String(doc[k]) !== String(o.$ne);
    }
    return String(doc[k]) === String(c);
  });

vi.mock("@/models/Payment", () => ({
  Payment: {
    findOne: (f: Doc) => chain(() => { const d = [...payments.values()].find((x) => matches(x, f)); return d ? { ...d } : null; }),
    findById: (id: string) => chain(() => ({ ...payments.get(id) })),
    find: () => chain(() => []),
    findOneAndUpdate: (f: Doc, u: { $set: Doc }) =>
      chain(() => {
        const d = [...payments.values()].find((x) => matches(x, f));
        if (!d) return null;
        Object.assign(d, u.$set);
        return { ...d };
      }),
  },
}));
vi.mock("@/models/Order", () => ({
  Order: { findById: () => chain(() => ({ _id: "o1", orderNumber: 7, customer: "u1", prepaymentAmount: 5000 })) },
}));
vi.mock("@/lib/payment/gateways/sepehr-gateway", () => ({
  sepehrGateway: {
    id: "sepehr",
    verifyPayment: (...a: unknown[]) => verify(...a),
    extractReceipt: (d?: Record<string, string>) => d?.digitalreceipt ?? null,
  },
}));
vi.mock("@/lib/payment/digital-receipt", () => ({ isDigitalReceiptUsed: (...a: unknown[]) => receiptUsed(...a) }));
vi.mock("@/lib/notifications/events", () => ({ notifyPaymentResult: vi.fn().mockResolvedValue(undefined) }));
vi.mock("@/lib/db/transaction", () => ({ runInTransaction: async (fn: (s: null) => unknown) => fn(null) }));
vi.mock("@/lib/wallet/wallet-service", () => ({
  adjustWalletBalance: async (p: { idempotencyKey: string }) => {
    if (refunds.has(p.idempotencyKey)) return;
    refunds.add(p.idempotencyKey);
    walletCredits += 1;
  },
}));

import { processGatewayCallback } from "@/lib/payment/process-gateway-callback";

const INV = "c".repeat(32);
const DATA = { invoiceid: INV, digitalreceipt: "rcpt-0123456789", respcode: "0" };
const seed = (over: Doc = {}) =>
  payments.set("p1", {
    _id: "p1", order: "o1", amount: 5000, walletAmount: 2000, provider: "sepehr", status: "pending",
    authority: INV, processingToken: null, processingStartedAt: null, ...over,
  });
const run = (data: Record<string, string> | undefined = DATA) =>
  processGatewayCallback({ authority: INV, gateway: "sepehr", callbackData: data });

beforeEach(() => {
  payments.clear();
  refunds.clear();
  walletCredits = 0;
  verify.mockReset();
  receiptUsed.mockReset();
  receiptUsed.mockResolvedValue(false);
});

describe("processGatewayCallback with Sepehr", () => {
  it("success: stores receipt + refId, verifies stored amount with callback data", async () => {
    seed();
    verify.mockResolvedValue({ success: true, refId: 125, cardPan: "6037****1", digitalReceipt: "rcpt-0123456789" });
    expect(await run()).toMatchObject({ outcome: "success" });
    expect(verify).toHaveBeenCalledWith({ amount: 5000, authority: INV, callbackData: DATA });
    expect(payments.get("p1")).toMatchObject({ status: "paid", refId: 125, digitalReceipt: "rcpt-0123456789" });
  });

  it("replay after success does not call the gateway again", async () => {
    seed();
    verify.mockResolvedValue({ success: true, refId: 1, cardPan: null, digitalReceipt: "rcpt-0123456789" });
    await run();
    await run();
    expect(verify).toHaveBeenCalledTimes(1);
  });

  it("zarinpal-provider record is not found by a Sepehr callback", async () => {
    seed({ provider: "zarinpal" });
    expect(await run()).toEqual({ outcome: "error" });
    expect(verify).not.toHaveBeenCalled();
  });

  it("reused digital receipt: no Advice, pending + manual review", async () => {
    seed();
    receiptUsed.mockResolvedValue(true);
    expect(await run()).toMatchObject({ outcome: "pending" });
    expect(verify).not.toHaveBeenCalled();
    expect(payments.get("p1")).toMatchObject({ status: "pending", needsManualReview: true });
  });

  it("user cancel: failed once, wallet share refunded exactly once", async () => {
    seed();
    verify.mockResolvedValue({ success: false, code: -1, message: "لغو", retryable: false, unconfirmed: false });
    expect(await run({ ...DATA, respcode: "-1" })).toMatchObject({ outcome: "failed" });
    await run();
    expect(walletCredits).toBe(1);
    expect(payments.get("p1")).toMatchObject({ status: "failed" });
  });

  it("unconfirmed Advice code: stays pending, no refund", async () => {
    seed();
    verify.mockResolvedValue({ success: false, code: -7, message: "x", retryable: false, unconfirmed: true });
    expect(await run()).toMatchObject({ outcome: "pending" });
    expect(walletCredits).toBe(0);
    expect(payments.get("p1")).toMatchObject({ status: "pending", needsManualReview: true });
  });

  it("retryable (forged/temporary): stays pending without flags", async () => {
    seed();
    verify.mockResolvedValue({ success: false, code: -1001, message: "x", retryable: true, unconfirmed: false });
    expect(await run()).toMatchObject({ outcome: "pending" });
    expect(payments.get("p1")).toMatchObject({ status: "pending", processingToken: null });
    expect(payments.get("p1")!.needsManualReview).toBeUndefined();
  });
});
