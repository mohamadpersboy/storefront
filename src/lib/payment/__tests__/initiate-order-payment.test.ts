import { beforeEach, describe, expect, it, vi } from "vitest";
import mongoose from "mongoose";

/**
 * Fake store (تک‌سند اتمیک در JS). DB واقعی در این فایل نیست؛
 * هم‌زمانی روی Mongo واقعی در `initiate-payment.itest.ts` بررسی می‌شود.
 */
type Doc = Record<string, unknown>;
const ORDER_ID = new mongoose.Types.ObjectId();
const USER_ID = new mongoose.Types.ObjectId();

let order: Doc;
const payments: Doc[] = [];
let balance = 0;
const applied = new Set<string>();
const txRows = new Map<string, { amount: number }>();
let gatewayCalls = 0;
let gatewayResult: { authority: string; paymentUrl: string } | { code: number; message: string };
let gatewayDelay = false;

const q = <T,>(get: () => T | Promise<T>) => {
  const o = {
    select: () => o,
    lean: () => o,
    sort: () => o,
    populate: () => o,
    then: (res: (v: T) => unknown, rej?: (e: unknown) => unknown) => Promise.resolve(get()).then(res, rej),
    catch: (rej: (e: unknown) => unknown) => Promise.resolve(get()).catch(rej),
  };
  return o;
};

vi.mock("@/config/env", () => ({ env: { NEXT_PUBLIC_APP_URL: "http://localhost:3000" } }));
vi.mock("@/models/Order", () => ({
  Order: {
    findById: () => q(() => order),
    findOneAndUpdate: (filter: Doc, update: { $set: Doc }, opts: { returnDocument: string }) =>
      q(() => {
        const tok = order.paymentInitiationToken as string | null | undefined;
        const started = order.paymentInitiationStartedAt as Date | null | undefined;
        const stale = (filter.$or as Doc[]).some((f) => {
          const c = f.paymentInitiationStartedAt as { $lt: Date } | undefined;
          return c ? started != null && started < c.$lt : false;
        });
        if (tok && !stale) return null;
        const before = { ...order };
        Object.assign(order, update.$set);
        return opts.returnDocument === "before" ? before : { ...order };
      }),
    updateOne: (filter: Doc, update: { $set: Doc }) =>
      q(() => {
        if (order.paymentInitiationToken === filter.paymentInitiationToken) Object.assign(order, update.$set);
      }),
  },
}));
vi.mock("@/models/Payment", () => ({
  Payment: {
    aggregate: () =>
      q(() => {
        const total = payments
          .filter((p) => p.status === "paid")
          .reduce((s, p) => s + (p.amount as number) + ((p.walletAmount as number) ?? 0), 0);
        return total ? [{ _id: null, total }] : [];
      }),
    findOne: () =>
      q(() => {
        const open = payments.filter((p) => p.status === "pending" || p.status === "processing");
        const p = open[open.length - 1];
        return p ? { ...p, id: String(p._id) } : null;
      }),
    exists: (f: { _id: unknown }) => q(() => (payments.some((p) => String(p._id) === String(f._id)) ? { _id: f._id } : null)),
    create: async (d: Doc) => {
      await Promise.resolve();
      payments.push({ ...d });
      return { ...d, id: String(d._id) };
    },
  },
}));
vi.mock("@/models/WalletTransaction", () => ({
  WalletTransaction: {
    findOne: (f: { idempotencyKey: string }) => q(() => txRows.get(f.idempotencyKey) ?? null),
  },
}));
vi.mock("@/lib/wallet/wallet-service", () => {
  class WalletAdjustmentError extends Error {}
  return {
    WalletAdjustmentError,
    getOrCreateWallet: async () => ({ balance }),
    isWalletOperationApplied: async (_u: string, key: string) => applied.has(key),
    adjustWalletBalance: async (p: { type: "debit" | "credit"; amount: number; idempotencyKey?: string }) => {
      if (p.idempotencyKey && applied.has(p.idempotencyKey)) return {};
      if (p.type === "debit" && balance < p.amount) throw new WalletAdjustmentError("low");
      balance += p.type === "credit" ? p.amount : -p.amount;
      if (p.idempotencyKey) {
        applied.add(p.idempotencyKey);
        txRows.set(p.idempotencyKey, { amount: p.amount });
      }
      return {};
    },
  };
});
vi.mock("@/lib/payment/zarinpal", () => ({
  getZarinpalStartPayUrl: (a: string) => `https://pay/${a}`,
  requestZarinpalPayment: async () => {
    gatewayCalls += 1;
    if (gatewayDelay) await new Promise((r) => setTimeout(r, 5));
    return gatewayResult;
  },
}));

import { initiateOrderPayment, PaymentInitiationError, PAYMENT_INITIATION_CLAIM_TTL_MS } from "@/lib/payment/initiate-order-payment";
import { paymentRefundKey, paymentWalletDebitKey } from "@/lib/payment/payment-keys";

const run = (useWallet = true) =>
  initiateOrderPayment({ orderId: String(ORDER_ID), initiatedByUserId: String(USER_ID), useWallet });

beforeEach(() => {
  order = {
    _id: ORDER_ID,
    orderNumber: 10001,
    paymentMethod: "online",
    prepaymentAmount: 1000,
    customer: { _id: USER_ID, phoneNumber: "09120000000" },
    paymentInitiationToken: null,
    paymentInitiationStartedAt: null,
  };
  payments.length = 0;
  balance = 400;
  applied.clear();
  txRows.clear();
  gatewayCalls = 0;
  gatewayDelay = false;
  gatewayResult = { authority: "A".repeat(36), paymentUrl: "https://pay/x" };
});

describe("initiateOrderPayment", () => {
  it("combined payment debits wallet once with a per-payment key and creates one pending Payment", async () => {
    const r = await run();
    expect(r.amount).toBe(600);
    expect(r.walletAmount).toBe(400);
    expect(balance).toBe(0);
    expect(payments).toHaveLength(1);
    expect(applied.has(paymentWalletDebitKey(payments[0]._id))).toBe(true);
    expect(order.paymentInitiationToken).toBeNull();
  });

  it("10 concurrent initiations: one gateway request, one debit, one Payment; others get 409 or reuse", async () => {
    gatewayDelay = true;
    const results = await Promise.allSettled(Array.from({ length: 10 }, () => run()));
    expect(gatewayCalls).toBe(1);
    expect(payments).toHaveLength(1);
    expect(balance).toBe(0);
    const ok = results.filter((r) => r.status === "fulfilled");
    expect(ok).toHaveLength(1);
    const rejected = results.filter((r) => r.status === "rejected") as PromiseRejectedResult[];
    expect(rejected.every((r) => r.reason instanceof PaymentInitiationError && r.reason.status === 409)).toBe(true);
  });

  it("after the first initiation, a repeat reuses the open Payment without a new debit or gateway call", async () => {
    await run();
    const again = await run();
    expect(again.reused).toBe(true);
    expect(gatewayCalls).toBe(1);
    expect(balance).toBe(0);
    expect(payments).toHaveLength(1);
  });

  it("gateway rejection refunds the wallet share exactly once and the claim is released", async () => {
    gatewayResult = { code: -9, message: "rejected" };
    await expect(run()).rejects.toMatchObject({ status: 502 });
    expect(balance).toBe(400);
    expect(payments).toHaveLength(0);
    expect(order.paymentInitiationToken).toBeNull();
    // تکرار بعدی دوباره کسر می‌کند (Payment جدید = کلید جدید) و دوباره درست برمی‌گردد
    await expect(run()).rejects.toMatchObject({ status: 502 });
    expect(balance).toBe(400);
  });

  it("alreadyPaid counts walletAmount: a fully paid combined order cannot be paid again", async () => {
    payments.push({ _id: new mongoose.Types.ObjectId(), status: "paid", amount: 600, walletAmount: 400 });
    await expect(run()).rejects.toMatchObject({ status: 409 });
    expect(gatewayCalls).toBe(0);
    expect(balance).toBe(400);
  });

  it("partially paid order only requests the true remainder", async () => {
    payments.push({ _id: new mongoose.Types.ObjectId(), status: "paid", amount: 300, walletAmount: 200 });
    balance = 0;
    const r = await run();
    expect(r.amount).toBe(500);
  });

  it("wallet covers everything: no gateway call, Payment is paid, debit applied once", async () => {
    balance = 5000;
    const r = await run();
    expect(r.paidFromWallet).toBe(true);
    expect(gatewayCalls).toBe(0);
    expect(balance).toBe(4000);
    expect(payments[0].status).toBe("paid");
  });

  it("stale claim after a crash between debit and Payment: orphan debit is refunded once, then a fresh initiation works", async () => {
    const orphan = new mongoose.Types.ObjectId();
    applied.add(paymentWalletDebitKey(orphan));
    txRows.set(paymentWalletDebitKey(orphan), { amount: 400 });
    balance = 0; // کسر یتیم اعمال شده بود
    order.paymentInitiationToken = "old-token";
    order.paymentInitiationPaymentId = orphan;
    order.paymentInitiationStartedAt = new Date(Date.now() - PAYMENT_INITIATION_CLAIM_TTL_MS - 1000);
    await run();
    expect(applied.has(paymentRefundKey(orphan))).toBe(true);
    // 400 برگشت و همان 400 دوباره برای Payment جدید کسر شد
    expect(balance).toBe(0);
    expect(payments).toHaveLength(1);
  });

  it("fresh (non-stale) claim by another request blocks with 409 and touches nothing", async () => {
    order.paymentInitiationToken = "other";
    order.paymentInitiationStartedAt = new Date();
    await expect(run()).rejects.toMatchObject({ status: 409 });
    expect(balance).toBe(400);
    expect(gatewayCalls).toBe(0);
    expect(order.paymentInitiationToken).toBe("other");
  });

  it("cash orders and unknown orders are rejected before any claim", async () => {
    order.paymentMethod = "cash";
    await expect(run()).rejects.toMatchObject({ status: 422 });
    expect(order.paymentInitiationToken).toBeNull();
  });
});
