import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Fake store با معنای اتمیک Mongo برای `findOneAndUpdate` (تک‌سند،
 * هم‌زمان‌ناپذیر در JS). DB واقعی در این محیط نیست؛ تست هم‌زمانی روی
 * DB واقعی = NOT VERIFIED.
 */
type Doc = Record<string, unknown>;
const payments = new Map<string, Doc>();
const orders = new Map<string, Doc>();
const refunds = new Map<string, number>(); // idempotencyKey → تعداد اثر مالی
let walletCredits = 0;

function matches(doc: Doc, filter: Doc): boolean {
  return Object.entries(filter).every(([key, cond]) => {
    if (key === "$or") return (cond as Doc[]).some((f) => matches(doc, f));
    const val = doc[key];
    if (cond && typeof cond === "object" && !(cond instanceof Date)) {
      const c = cond as Doc;
      if ("$lt" in c) return val != null && (val as Date) < (c.$lt as Date);
      if ("$ne" in c) return String(val) !== String(c.$ne);
    }
    return String(val) === String(cond);
  });
}

const chain = <T,>(get: () => T) => {
  const q = {
    select: () => q,
    lean: () => q,
    then: (res: (v: T) => unknown, rej?: (e: unknown) => unknown) =>
      Promise.resolve().then(get).then(res, rej),
  };
  return q;
};

const verify = vi.fn();
const notify = vi.fn();
let failFinalize = false;
let failFlag = false;

vi.mock("@/models/Payment", () => ({
  Payment: {
    findOne: (f: Doc) =>
      chain(() => {
        const d = [...payments.values()].find((x) => matches(x, f));
        return d ? { ...d } : null;
      }),
    findById: (id: string) => chain(() => (payments.get(String(id)) ? { ...payments.get(String(id)) } : null)),
    find: (f: Doc) => chain(() => [...payments.values()].filter((x) => matches(x, f)).map((x) => ({ ...x }))),
    findOneAndUpdate: (f: Doc, u: { $set: Doc }, o?: { new?: boolean }) =>
      chain(() => {
        if (failFinalize && (u.$set.status === "failed" || u.$set.status === "paid")) {
          throw new Error("db down");
        }
        if (failFlag && u.$set.needsManualReview === true) throw new Error("db down");
        const d = [...payments.values()].find((x) => matches(x, f));
        if (!d) return null;
        Object.assign(d, u.$set);
        return o?.new ? { ...d } : { ...d };
      }),
  },
}));
vi.mock("@/models/Order", () => ({
  Order: { findById: (id: string) => chain(() => (orders.get(String(id)) ? { ...orders.get(String(id)) } : null)) },
}));
vi.mock("@/lib/payment/zarinpal", () => ({ verifyZarinpalPayment: (...a: unknown[]) => verify(...a) }));
vi.mock("@/lib/notifications/events", () => ({ notifyPaymentResult: (...a: unknown[]) => notify(...a) }));
vi.mock("@/lib/db/transaction", () => ({
  runInTransaction: async (fn: (s: null) => unknown) => fn(null),
}));
vi.mock("@/lib/wallet/wallet-service", () => ({
  adjustWalletBalance: async (p: { idempotencyKey?: string }) => {
    const key = p.idempotencyKey ?? "none";
    if (refunds.has(key)) return; // همان رفتار کلید یکتا
    refunds.set(key, 1);
    walletCredits += 1;
  },
}));

import { processGatewayCallback, PROCESSING_CLAIM_TTL_MS } from "@/lib/payment/process-gateway-callback";

const AUTH = "A00000000000000000000000000000012345";
const PID = "p1";

function seed(over: Doc = {}, orderOver: Doc = {}) {
  payments.set(PID, {
    _id: PID,
    order: "o1",
    amount: 100000,
    walletAmount: 0,
    provider: "zarinpal",
    status: "pending",
    authority: AUTH,
    processingToken: null,
    processingStartedAt: null,
    reconciliationNote: null,
    refId: null,
    ...over,
  });
  orders.set("o1", { _id: "o1", orderNumber: 10005, customer: "u1", prepaymentAmount: 100000, ...orderOver });
}
const ok = { success: true, refId: 777, cardPan: "6037****1234" };
// کد پیش‌فرض -99 عمداً خارج از چهار کد تأییدنشده است (فقط یک نماینده
// «خطای قطعیِ غیرمرتبط» برای تست مسیر شکست/استرداد؛ معنی رسمی ندارد).
const fail = (retryable: boolean, code = -99) => ({ success: false, code, message: "x", retryable });
const UNCONFIRMED_CODES = [-50, -51, -53, -54] as const;
const run = () => processGatewayCallback({ authority: AUTH });
const pay = () => payments.get(PID)!;

beforeEach(() => {
  payments.clear();
  orders.clear();
  refunds.clear();
  walletCredits = 0;
  failFinalize = false;
  failFlag = false;
  verify.mockReset();
  notify.mockReset();
  notify.mockResolvedValue(undefined);
});

describe("processGatewayCallback — موفقیت و تکرار", () => {
  it("verifies with the STORED amount and marks paid once", async () => {
    seed();
    verify.mockResolvedValue(ok);
    const r = await run();
    expect(r).toEqual({ outcome: "success", orderNumber: 10005, amount: 100000 });
    expect(verify).toHaveBeenCalledWith({ amount: 100000, authority: AUTH });
    expect(pay()).toMatchObject({ status: "paid", refId: 777, processingToken: null });
    expect(notify).toHaveBeenCalledTimes(1);
  });

  it("replayed callback after success: no second verify, no second effect", async () => {
    seed();
    verify.mockResolvedValue(ok);
    await run();
    await run();
    await run();
    expect(verify).toHaveBeenCalledTimes(1);
    expect(notify).toHaveBeenCalledTimes(1);
    expect(pay().status).toBe("paid");
  });

  it("concurrent callbacks: exactly one verify, one paid, one notification", async () => {
    seed();
    verify.mockImplementation(async () => {
      await new Promise((r) => setTimeout(r, 5));
      return ok;
    });
    const results = await Promise.all(Array.from({ length: 8 }, run));
    expect(verify).toHaveBeenCalledTimes(1);
    expect(notify).toHaveBeenCalledTimes(1);
    expect(pay().status).toBe("paid");
    expect(results.filter((r) => r.outcome === "success").length).toBeGreaterThanOrEqual(1);
    expect(results.every((r) => r.outcome === "success" || r.outcome === "pending")).toBe(true);
  });

  it("flags a verified payment arriving for an already covered order (no auto effect)", async () => {
    seed();
    payments.set("p0", { _id: "p0", order: "o1", amount: 100000, walletAmount: 0, status: "paid", authority: "other" });
    verify.mockResolvedValue(ok);
    await run();
    expect(pay().status).toBe("paid");
    expect(pay().reconciliationNote).toBe("duplicate_payment_order_already_covered");
  });

  it("notification failure never changes the financial result", async () => {
    seed();
    verify.mockResolvedValue(ok);
    notify.mockRejectedValue(new Error("boom"));
    const r = await run();
    expect(r.outcome).toBe("success");
    expect(pay().status).toBe("paid");
  });
});

describe("processGatewayCallback — شکست و استرداد", () => {
  it("definitive failure refunds the wallet part exactly once", async () => {
    seed({ walletAmount: 40000 });
    verify.mockResolvedValue(fail(false));
    const r = await run();
    expect(r.outcome).toBe("failed");
    expect(pay().status).toBe("failed");
    expect(walletCredits).toBe(1);
    expect(notify).toHaveBeenCalledTimes(1);
  });

  it("replay and concurrency on a failed payment never refund twice", async () => {
    seed({ walletAmount: 40000 });
    verify.mockImplementation(async () => {
      await new Promise((r) => setTimeout(r, 5));
      return fail(false);
    });
    await Promise.all(Array.from({ length: 6 }, run));
    await run();
    await run();
    expect(walletCredits).toBe(1);
    expect(verify).toHaveBeenCalledTimes(1);
    expect(pay().status).toBe("failed");
  });

  it("timeout / unknown gateway error keeps the payment pending (no fail, no refund)", async () => {
    seed({ walletAmount: 40000 });
    verify.mockResolvedValue(fail(true, 0));
    const r = await run();
    expect(r.outcome).toBe("pending");
    expect(pay()).toMatchObject({ status: "pending", processingToken: null });
    expect(walletCredits).toBe(0);
    expect(notify).not.toHaveBeenCalled();
  });

  it("a later retry after a timeout can still finish the payment", async () => {
    seed();
    verify.mockResolvedValueOnce(fail(true, 0)).mockResolvedValueOnce(ok);
    await run();
    const r = await run();
    expect(r.outcome).toBe("success");
    expect(pay().status).toBe("paid");
  });

  it("a payment the gateway verified is paid even if the client said NOK (verify is the only authority)", async () => {
    seed();
    verify.mockResolvedValue(ok); // کاربر Status=NOK فرستاده؛ سرویس آن را اصلاً نمی‌گیرد
    expect((await run()).outcome).toBe("success");
  });
});

describe("processGatewayCallback — کدهای تأییدنشده -50/-51/-53/-54", () => {
  it.each(UNCONFIRMED_CODES)(
    "code %i: stays pending, flagged for manual review, no refund, no failure notice",
    async (code) => {
      seed({ walletAmount: 40000 });
      verify.mockResolvedValue({ success: false, code, message: "gw-msg", retryable: false });
      const r = await run();
      expect(r).toEqual({ outcome: "pending", orderNumber: 10005, amount: 100000 });
      expect(pay()).toMatchObject({
        status: "pending",
        processingToken: null,
        processingStartedAt: null,
        needsManualReview: true,
      });
      expect(pay().status).not.toBe("failed");
      expect(pay().reconciliationNote).toContain("manual_review_required");
      expect(pay().reconciliationNote).toContain(`code ${code}`);
      expect(walletCredits).toBe(0);
      expect(refunds.size).toBe(0);
      expect(notify).not.toHaveBeenCalled();
    },
  );

  it("replay and concurrency never refund, notify, or fail", async () => {
    seed({ walletAmount: 40000 });
    verify.mockImplementation(async () => {
      await new Promise((r) => setTimeout(r, 5));
      return { success: false, code: -53, message: "x", retryable: false };
    });
    const results = await Promise.all(Array.from({ length: 6 }, run));
    await run();
    await run();
    expect(results.every((r) => r.outcome === "pending")).toBe(true);
    expect(walletCredits).toBe(0);
    expect(notify).not.toHaveBeenCalled();
    expect(pay()).toMatchObject({ status: "pending", needsManualReview: true, processingToken: null });
  });

  it("a later retry with a verified payment makes it paid and clears the review flag", async () => {
    seed({ walletAmount: 40000 });
    verify
      .mockResolvedValueOnce({ success: false, code: -54, message: "x", retryable: false })
      .mockResolvedValueOnce(ok);
    expect((await run()).outcome).toBe("pending");
    expect(pay().needsManualReview).toBe(true);
    const r = await run();
    expect(r.outcome).toBe("success");
    expect(pay()).toMatchObject({
      status: "paid",
      refId: 777,
      needsManualReview: false,
      reconciliationNote: null,
      processingToken: null,
    });
    expect(walletCredits).toBe(0);
    expect(notify).toHaveBeenCalledTimes(1);
    expect(notify).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it("a verified retry on an already covered order keeps the duplicate-payment note", async () => {
    seed();
    payments.set("p0", { _id: "p0", order: "o1", amount: 100000, walletAmount: 0, status: "paid", authority: "other" });
    verify
      .mockResolvedValueOnce({ success: false, code: -51, message: "x", retryable: false })
      .mockResolvedValueOnce(ok);
    await run();
    await run();
    expect(pay()).toMatchObject({
      status: "paid",
      needsManualReview: false,
      reconciliationNote: "duplicate_payment_order_already_covered",
    });
  });

  it("a retry that is still unknown never fails or refunds, and keeps the flag", async () => {
    seed({ walletAmount: 40000 });
    verify
      .mockResolvedValueOnce({ success: false, code: -50, message: "x", retryable: false })
      .mockResolvedValueOnce(fail(true, 0)) // timeout / network
      .mockResolvedValueOnce({ success: false, code: -53, message: "x", retryable: false });
    await run();
    await run();
    expect(pay()).toMatchObject({ status: "pending", needsManualReview: true });
    await run();
    expect(pay()).toMatchObject({ status: "pending", needsManualReview: true });
    expect(walletCredits).toBe(0);
    expect(notify).not.toHaveBeenCalled();
  });

  it("a timeout on a fresh payment keeps the old behaviour: pending, NOT flagged", async () => {
    seed();
    verify.mockResolvedValue(fail(true, 0));
    expect((await run()).outcome).toBe("pending");
    expect(pay().needsManualReview).toBeFalsy();
    expect(pay().reconciliationNote).toBeNull();
  });

  it("a definitive failure with a code outside the four still fails and refunds once", async () => {
    seed({ walletAmount: 40000 });
    verify.mockResolvedValue(fail(false, -99));
    const r = await run();
    expect(r.outcome).toBe("failed");
    expect(pay()).toMatchObject({ status: "failed", processingToken: null });
    expect(pay().needsManualReview).toBeFalsy();
    expect(refunds.has(`payment-refund:${PID}`)).toBe(true);
    expect(walletCredits).toBe(1);
    expect(notify).toHaveBeenCalledTimes(1);
    expect(notify).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
  });

  it("DB failure while flagging surfaces as an error; claim stays and no refund happens", async () => {
    seed({ walletAmount: 40000 });
    verify.mockResolvedValue({ success: false, code: -53, message: "x", retryable: false });
    failFlag = true;
    await expect(run()).rejects.toThrow("db down");
    failFlag = false;
    expect(pay().status).toBe("processing");
    expect(walletCredits).toBe(0);
    expect(notify).not.toHaveBeenCalled();
  });
});

describe("processGatewayCallback — Claim و بازیابی", () => {
  it("a fresh processing claim is respected: no verify, answer pending", async () => {
    seed({ status: "processing", processingToken: "other", processingStartedAt: new Date() });
    const r = await run();
    expect(r.outcome).toBe("pending");
    expect(verify).not.toHaveBeenCalled();
  });

  it("a stale claim is taken over and finished", async () => {
    seed({
      status: "processing",
      processingToken: "dead",
      processingStartedAt: new Date(Date.now() - PROCESSING_CLAIM_TTL_MS - 1000),
    });
    verify.mockResolvedValue(ok);
    const r = await run();
    expect(r.outcome).toBe("success");
    expect(pay()).toMatchObject({ status: "paid", processingToken: null });
  });

  it("crash after refund but before finalize: takeover finishes without a second refund", async () => {
    seed({
      walletAmount: 40000,
      status: "processing",
      processingToken: "dead",
      processingStartedAt: new Date(Date.now() - PROCESSING_CLAIM_TTL_MS - 1000),
    });
    refunds.set(`payment-refund:${PID}`, 1); // استرداد قبلاً اعمال شده
    walletCredits = 1;
    verify.mockResolvedValue(fail(false));
    const r = await run();
    expect(r.outcome).toBe("failed");
    expect(walletCredits).toBe(1);
    expect(pay().status).toBe("failed");
  });

  it("DB failure while finalizing surfaces as an error (route turns it into 'pending')", async () => {
    seed();
    verify.mockResolvedValue(ok);
    failFinalize = true;
    await expect(run()).rejects.toThrow("db down");
    failFinalize = false;
    // Claim باقی مانده؛ بعد از TTL دوباره پردازش می‌شود
    expect(pay().status).toBe("processing");
  });
});

describe("processGatewayCallback — ورودی نامعتبر", () => {
  it("unknown authority → error, nothing touched", async () => {
    const r = await run();
    expect(r.outcome).toBe("error");
    expect(verify).not.toHaveBeenCalled();
  });

  it("malformed / injected authority is rejected before any query", async () => {
    for (const a of [null, "", "short", "x".repeat(200), '{"$ne":null}', "A12345678901 OR 1"]) {
      expect((await processGatewayCallback({ authority: a as string | null })).outcome).toBe("error");
    }
    expect(verify).not.toHaveBeenCalled();
  });

  it("a payment of a non-gateway provider is never processed here", async () => {
    seed({ provider: "manual" });
    expect((await run()).outcome).toBe("error");
    expect(verify).not.toHaveBeenCalled();
  });
});
