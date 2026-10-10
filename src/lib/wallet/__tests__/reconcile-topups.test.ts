/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Fake Store اتمیک در حافظه. توجه: این تست‌ها منطق Claim/Idempotency را
 * اثبات می‌کنند، نه رفتار هم‌زمانی/Transaction واقعی MongoDB (NOT VERIFIED).
 */
type Topup = {
  _id: string; user: string; amount: number; authority: string; status: string;
  processingToken: string | null; processingStartedAt: Date | null;
  refId?: number | null; createdAt: Date; reconciliationNote?: string | null;
};
type WalletRow = { _id: string; user: string; balance: number; appliedOperationKeys: string[] };

const topups = new Map<string, Topup>();
const wallets = new Map<string, WalletRow>();
const txs: { idempotencyKey?: string; user: string; amount: number }[] = [];
const hooks = { failTxCreateOnce: false, failPaidFinalizeOnce: false, failWalletUpdateOnce: false };
const verify = vi.fn();

function q<T>(get: () => T) {
  const o = {
    session: () => o, select: () => o, lean: async () => get(),
    then: (res: (v: T) => unknown, rej?: (e: unknown) => unknown) => Promise.resolve(get()).then(res, rej),
  };
  return o;
}

vi.mock("@/lib/payment/zarinpal", () => ({ verifyZarinpalPayment: (a: unknown) => verify(a) }));
vi.mock("@/lib/db/transaction", () => ({ runInTransaction: (fn: (s: null) => unknown) => fn(null) }));

vi.mock("@/models/WalletTopup", () => ({
  WalletTopup: {
    findOne: ({ authority }: { authority: string }) =>
      q(() => [...topups.values()].find((t) => t.authority === authority) ?? null),
    findById: (id: string) => q(() => topups.get(id) ?? null),
    find: (f: any) => {
      const staleBefore = f.$or[1].processingStartedAt.$lt as Date;
      let rows = [...topups.values()].filter(
        (t) =>
          (t.reconciliationNote ?? null) === null &&
          t.createdAt < f.createdAt.$lt &&
          (t.status === "pending" ||
            (t.status === "processing" && !!t.processingStartedAt && t.processingStartedAt < staleBefore)),
      );
      const o: any = {
        sort: () => { rows = rows.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()); return o; },
        limit: (n: number) => { rows = rows.slice(0, n); return o; },
        select: () => o,
        lean: async () => rows.map((r) => ({ _id: r._id, authority: r.authority, createdAt: r.createdAt })),
      };
      return o;
    },
    findOneAndUpdate: (f: any, u: { $set: Record<string, unknown> }) => {
      if (u.$set.status === "paid" && hooks.failPaidFinalizeOnce) {
        hooks.failPaidFinalizeOnce = false;
        return { select: () => ({ lean: async () => { throw new Error("db down"); } }) };
      }
      const t = topups.get(f._id);
      const match = (() => {
        if (!t) return false;
        if ("reconciliationNote" in f && (t.reconciliationNote ?? null) !== null) return false;
        if (f.$or) {
          return f.$or.some((c: any) =>
            c.status === t.status &&
            (!c.processingStartedAt || (t.processingStartedAt && t.processingStartedAt < c.processingStartedAt.$lt)));
        }
        return t.status === f.status && t.processingToken === f.processingToken;
      })();
      if (match) Object.assign(t!, u.$set);
      return q(() => (match ? t : null));
    },
  },
}));

vi.mock("@/models/Wallet", () => ({
  Wallet: {
    findOne: (f: any) =>
      q(() => {
        const w = [...wallets.values()].find((x) => x.user === f.user);
        if (!w) return null;
        if (f.appliedOperationKeys && !w.appliedOperationKeys.includes(f.appliedOperationKeys)) return null;
        return w;
      }),
    create: async (d: { user: string; balance: number }) => {
      const w = { _id: `w-${d.user}`, user: d.user, balance: d.balance, appliedOperationKeys: [] };
      wallets.set(w._id, w);
      return w;
    },
    findOneAndUpdate: (f: any, u: any) => {
      if (hooks.failWalletUpdateOnce) { hooks.failWalletUpdateOnce = false; throw new Error("db down"); }
      const w = [...wallets.values()].find((x) => x.user === f.user);
      const blocked = f.appliedOperationKeys && w?.appliedOperationKeys.includes(f.appliedOperationKeys.$ne);
      if (!w || blocked) return q(() => null);
      w.balance += u.$inc.balance;
      if (u.$push) w.appliedOperationKeys.push(u.$push.appliedOperationKeys);
      return q(() => ({ ...w }));
    },
  },
}));

vi.mock("@/models/WalletTransaction", () => ({
  WalletTransaction: {
    findOne: ({ idempotencyKey }: { idempotencyKey: string }) =>
      q(() => (txs.some((t) => t.idempotencyKey === idempotencyKey) ? { _id: "t" } : null)),
    create: async (docs: any[]) => {
      if (hooks.failTxCreateOnce) { hooks.failTxCreateOnce = false; throw new Error("db down"); }
      const d = docs[0];
      if (d.idempotencyKey && txs.some((t) => t.idempotencyKey === d.idempotencyKey)) {
        throw Object.assign(new Error("dup"), { code: 11000 });
      }
      txs.push(d);
    },
  },
}));

import { processTopupCallback, TOPUP_CLAIM_TTL_MS } from "@/lib/wallet/process-topup-callback";
import { reconcileTopups, MANUAL_REVIEW_NOTE_TOO_OLD, RECONCILE_MIN_AGE_MS, RECONCILE_MAX_AGE_MS } from "@/lib/wallet/reconcile-topups";

const NOW = new Date("2026-01-10T00:00:00Z");
const OK = { success: true, refId: 111, cardPan: "6037" };
const auth = (n: number) => `A${String(n).padStart(35, "0")}`;
const minutesAgo = (m: number) => new Date(NOW.getTime() - m * 60 * 1000);

function addTopup(id: string, user: string, amount: number, n: number, createdAt: Date) {
  topups.set(id, {
    _id: id, user, amount, authority: auth(n), status: "pending",
    processingToken: null, processingStartedAt: null, createdAt, reconciliationNote: null,
  });
  if (![...wallets.values()].some((w) => w.user === user)) {
    wallets.set(`w-${user}`, { _id: `w-${user}`, user, balance: 0, appliedOperationKeys: [] });
  }
}
const bal = (u: string) => wallets.get(`w-${u}`)!.balance;
const note = (id: string) => topups.get(id)!.reconciliationNote ?? null;

beforeEach(() => {
  topups.clear(); wallets.clear(); txs.length = 0; verify.mockReset();
  hooks.failTxCreateOnce = false; hooks.failPaidFinalizeOnce = false; hooks.failWalletUpdateOnce = false;
});

describe("reconcileTopups (Fake Store — NOT VERIFIED on real MongoDB)", () => {
  it("credits an eligible stuck pending top-up exactly once", async () => {
    addTopup("t1", "u1", 5000, 1, minutesAgo(60));
    verify.mockResolvedValue(OK);
    const s = await reconcileTopups({ now: NOW });
    expect(s.credited).toBe(1);
    expect(bal("u1")).toBe(5000);
    expect(topups.get("t1")!.status).toBe("paid");
    const s2 = await reconcileTopups({ now: NOW });
    expect(s2.scanned).toBe(0);
    expect(bal("u1")).toBe(5000);
  });

  it("skips top-ups younger than the minimum age", async () => {
    addTopup("t1", "u1", 5000, 1, new Date(NOW.getTime() - RECONCILE_MIN_AGE_MS + 60_000));
    const s = await reconcileTopups({ now: NOW });
    expect(s.scanned).toBe(0);
    expect(verify).not.toHaveBeenCalled();
  });

  it("two crons in parallel credit once", async () => {
    addTopup("t1", "u1", 5000, 1, minutesAgo(60));
    verify.mockResolvedValue(OK);
    const [a, b] = await Promise.all([reconcileTopups({ now: NOW }), reconcileTopups({ now: NOW })]);
    expect(a.credited + b.credited).toBe(1);
    expect(bal("u1")).toBe(5000);
    expect(txs).toHaveLength(1);
  });

  it("cron and user callback in parallel credit once", async () => {
    addTopup("t1", "u1", 5000, 1, minutesAgo(60));
    verify.mockResolvedValue(OK);
    await Promise.all([
      reconcileTopups({ now: NOW }),
      processTopupCallback({ authority: auth(1), now: NOW }),
      processTopupCallback({ authority: auth(1), now: NOW }),
    ]);
    expect(bal("u1")).toBe(5000);
    expect(txs).toHaveLength(1);
    expect(topups.get("t1")!.status).toBe("paid");
  });

  it("recovers a crash after claim (stale processing) without double credit", async () => {
    addTopup("t1", "u1", 5000, 1, minutesAgo(60));
    const t = topups.get("t1")!;
    t.status = "processing"; t.processingToken = "dead"; t.processingStartedAt = new Date(NOW.getTime() - TOPUP_CLAIM_TTL_MS - 1000);
    verify.mockResolvedValue(OK);
    const s = await reconcileTopups({ now: NOW });
    expect(s.credited).toBe(1);
    expect(bal("u1")).toBe(5000);
  });

  it("does not touch a fresh processing claim", async () => {
    addTopup("t1", "u1", 5000, 1, minutesAgo(60));
    const t = topups.get("t1")!;
    t.status = "processing"; t.processingToken = "live"; t.processingStartedAt = new Date(NOW.getTime() - 1000);
    const s = await reconcileTopups({ now: NOW });
    expect(s.scanned).toBe(0);
    expect(t.processingToken).toBe("live");
  });

  it("exception after claim: record released, error isolated, next record still processed", async () => {
    addTopup("t1", "u1", 5000, 1, minutesAgo(120));
    addTopup("t2", "u2", 3000, 2, minutesAgo(60));
    verify.mockRejectedValueOnce(new Error("boom")).mockResolvedValue(OK);
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const s = await reconcileTopups({ now: NOW });
    spy.mockRestore();
    expect(s.errors).toBe(1);
    expect(s.credited).toBe(1);
    expect(topups.get("t1")!.status).toBe("pending");
    expect(topups.get("t1")!.processingToken).toBeNull();
    expect(bal("u2")).toBe(3000);
  });

  it("crash after balance increase and before paid: recovery does not credit again", async () => {
    addTopup("t1", "u1", 5000, 1, minutesAgo(60));
    verify.mockResolvedValue(OK);
    hooks.failPaidFinalizeOnce = true;
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const s1 = await reconcileTopups({ now: NOW });
    spy.mockRestore();
    expect(s1.errors).toBe(1);
    expect(bal("u1")).toBe(5000);
    expect(topups.get("t1")!.status).toBe("pending");
    const s2 = await reconcileTopups({ now: NOW });
    expect(s2.credited).toBe(1);
    expect(bal("u1")).toBe(5000);
    expect(txs).toHaveLength(1);
  });

  it("repairs a missing transaction row without increasing balance again", async () => {
    addTopup("t1", "u1", 5000, 1, minutesAgo(60));
    verify.mockResolvedValue(OK);
    hooks.failTxCreateOnce = true;
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    await reconcileTopups({ now: NOW });
    spy.mockRestore();
    expect(bal("u1")).toBe(5000);
    expect(txs).toHaveLength(0);
    await reconcileTopups({ now: NOW });
    expect(bal("u1")).toBe(5000);
    expect(txs).toHaveLength(1);
    expect(txs[0].idempotencyKey).toBe("topup-credit:t1");
  });

  it("too-old record is flagged for manual review without verify and is not failed", async () => {
    addTopup("t1", "u1", 5000, 1, new Date(NOW.getTime() - RECONCILE_MAX_AGE_MS - 1000));
    const s = await reconcileTopups({ now: NOW });
    expect(s.flaggedForReview).toBe(1);
    expect(verify).not.toHaveBeenCalled();
    expect(topups.get("t1")!.status).toBe("pending");
    expect(note("t1")).toBe(MANUAL_REVIEW_NOTE_TOO_OLD);
    expect(bal("u1")).toBe(0);
    const s2 = await reconcileTopups({ now: NOW });
    expect(s2.scanned).toBe(0);
  });

  it("definitive gateway code during cron is never auto-failed; flagged instead", async () => {
    addTopup("t1", "u1", 5000, 1, minutesAgo(60));
    verify.mockResolvedValue({ success: false, code: -54, message: "x", retryable: false });
    const s = await reconcileTopups({ now: NOW });
    expect(s.failed).toBe(0);
    expect(s.flaggedForReview).toBe(1);
    expect(topups.get("t1")!.status).toBe("pending");
    expect(note("t1")).toContain("manual_review_required");
    expect(bal("u1")).toBe(0);
  });

  it("transient gateway error keeps record pending and retryable", async () => {
    addTopup("t1", "u1", 5000, 1, minutesAgo(60));
    verify.mockResolvedValueOnce({ success: false, code: 0, message: "net", retryable: true });
    const s = await reconcileTopups({ now: NOW });
    expect(s.stillPending).toBe(1);
    expect(note("t1")).toBeNull();
    verify.mockResolvedValue(OK);
    expect((await reconcileTopups({ now: NOW })).credited).toBe(1);
  });

  it("limits records per run", async () => {
    for (let i = 1; i <= 5; i++) addTopup(`t${i}`, `u${i}`, 1000, i, minutesAgo(60 + i));
    verify.mockResolvedValue(OK);
    const s = await reconcileTopups({ now: NOW, limit: 2 });
    expect(s.scanned).toBe(2);
    expect([...topups.values()].filter((t) => t.status === "paid")).toHaveLength(2);
  });

  it("stops when the time budget is exhausted", async () => {
    for (let i = 1; i <= 3; i++) addTopup(`t${i}`, `u${i}`, 1000, i, minutesAgo(60 + i));
    verify.mockResolvedValue(OK);
    const s = await reconcileTopups({ now: NOW, timeBudgetMs: -1 });
    expect(s.stoppedByBudget).toBe(true);
    expect(s.scanned).toBe(0);
  });
});
