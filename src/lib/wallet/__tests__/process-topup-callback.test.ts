/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Fake Store اتمیک در حافظه. توجه: این تست‌ها منطق Claim/Idempotency را
 * اثبات می‌کنند، نه رفتار هم‌زمانی/Transaction واقعی MongoDB (NOT VERIFIED).
 */
type Topup = {
  _id: string; user: string; amount: number; authority: string; status: string;
  processingToken: string | null; processingStartedAt: Date | null;
  refId?: number | null;
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
    findOneAndUpdate: (f: any, u: { $set: Record<string, unknown> }) => {
      if (u.$set.status === "paid" && hooks.failPaidFinalizeOnce) {
        hooks.failPaidFinalizeOnce = false;
        return { select: () => ({ lean: async () => { throw new Error("db down"); } }) };
      }
      const t = topups.get(f._id);
      const match = (() => {
        if (!t) return false;
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

const T0 = new Date("2026-01-01T00:00:00Z");
const later = new Date(T0.getTime() + TOPUP_CLAIM_TTL_MS + 1000);
const OK = { success: true, refId: 111, cardPan: "6037" };

function addTopup(id: string, user: string, amount: number, authority: string) {
  topups.set(id, { _id: id, user, amount, authority, status: "pending", processingToken: null, processingStartedAt: null });
  if (![...wallets.values()].some((w) => w.user === user)) {
    wallets.set(`w-${user}`, { _id: `w-${user}`, user, balance: 0, appliedOperationKeys: [] });
  }
}
const bal = (u: string) => wallets.get(`w-${u}`)!.balance;
const AUTH1 = "A00000000000000000000000000000000001";
const AUTH2 = "A00000000000000000000000000000000002";

beforeEach(() => {
  topups.clear(); wallets.clear(); txs.length = 0; verify.mockReset();
  hooks.failTxCreateOnce = false; hooks.failPaidFinalizeOnce = false; hooks.failWalletUpdateOnce = false;
});

describe("processTopupCallback", () => {
  it("1: valid top-up credits the right wallet exactly once", async () => {
    addTopup("t1", "u1", 5000, AUTH1);
    addTopup("tx", "u2", 1, AUTH2);
    verify.mockResolvedValue(OK);
    const r = await processTopupCallback({ authority: AUTH1, now: T0 });
    expect(r.outcome).toBe("success");
    expect(bal("u1")).toBe(5000);
    expect(bal("u2")).toBe(0);
    expect(txs).toHaveLength(1);
    expect(topups.get("t1")!.status).toBe("paid");
    expect(verify).toHaveBeenCalledWith({ amount: 5000, authority: AUTH1 });
  });

  it("2: repeated callback does not credit twice", async () => {
    addTopup("t1", "u1", 5000, AUTH1);
    verify.mockResolvedValue(OK);
    await processTopupCallback({ authority: AUTH1, now: T0 });
    const r = await processTopupCallback({ authority: AUTH1, now: later });
    expect(r.outcome).toBe("success");
    expect(bal("u1")).toBe(5000);
    expect(txs).toHaveLength(1);
    expect(verify).toHaveBeenCalledTimes(1);
  });

  it("3: concurrent callbacks credit once", async () => {
    addTopup("t1", "u1", 5000, AUTH1);
    verify.mockResolvedValue(OK);
    const rs = await Promise.all(Array.from({ length: 6 }, () => processTopupCallback({ authority: AUTH1, now: T0 })));
    expect(rs.filter((r) => r.outcome === "success")).toHaveLength(1);
    expect(bal("u1")).toBe(5000);
    expect(txs).toHaveLength(1);
    expect(verify).toHaveBeenCalledTimes(1);
  });

  it("4: amount always comes from stored record; gateway mismatch (-50) fails with no credit", async () => {
    addTopup("t1", "u1", 5000, AUTH1);
    verify.mockResolvedValue({ success: false, code: -50, message: "x", retryable: false });
    const r = await processTopupCallback({ authority: AUTH1, now: T0 });
    expect(verify).toHaveBeenCalledWith({ amount: 5000, authority: AUTH1 });
    expect(r.outcome).toBe("failed");
    expect(bal("u1")).toBe(0);
    expect(txs).toHaveLength(0);
  });

  it("5: invalid or unknown authority cannot credit", async () => {
    addTopup("t1", "u1", 5000, AUTH1);
    expect((await processTopupCallback({ authority: null })).outcome).toBe("error");
    expect((await processTopupCallback({ authority: "x'$ne" })).outcome).toBe("error");
    expect((await processTopupCallback({ authority: "B0000000000000000000000000000000999" })).outcome).toBe("error");
    expect(verify).not.toHaveBeenCalled();
    expect(bal("u1")).toBe(0);
  });

  it("6: no credit without successful gateway verification", async () => {
    addTopup("t1", "u1", 5000, AUTH1);
    verify.mockResolvedValue({ success: false, code: 0, message: "net", retryable: true });
    const r = await processTopupCallback({ authority: AUTH1, now: T0 });
    expect(r.outcome).toBe("pending");
    expect(bal("u1")).toBe(0);
    expect(txs).toHaveLength(0);
  });

  it("7: temporary gateway error leaves it recoverable, later retry credits", async () => {
    addTopup("t1", "u1", 5000, AUTH1);
    verify.mockResolvedValueOnce({ success: false, code: 0, message: "net", retryable: true });
    expect((await processTopupCallback({ authority: AUTH1, now: T0 })).outcome).toBe("pending");
    expect(topups.get("t1")!.status).toBe("pending");
    verify.mockResolvedValue(OK);
    expect((await processTopupCallback({ authority: AUTH1, now: T0 })).outcome).toBe("success");
    expect(bal("u1")).toBe(5000);
  });

  it("8: definitive decline marks failed, no credit, and stays failed", async () => {
    addTopup("t1", "u1", 5000, AUTH1);
    verify.mockResolvedValue({ success: false, code: -53, message: "x", retryable: false });
    expect((await processTopupCallback({ authority: AUTH1, now: T0 })).outcome).toBe("failed");
    expect(topups.get("t1")!.status).toBe("failed");
    expect((await processTopupCallback({ authority: AUTH1, now: later })).outcome).toBe("failed");
    expect(verify).toHaveBeenCalledTimes(1);
    expect(bal("u1")).toBe(0);
  });

  it("9: stale claim is reclaimed; fresh claim is not", async () => {
    addTopup("t1", "u1", 5000, AUTH1);
    const t = topups.get("t1")!;
    t.status = "processing"; t.processingToken = "old"; t.processingStartedAt = T0;
    verify.mockResolvedValue(OK);
    const fresh = await processTopupCallback({ authority: AUTH1, now: new Date(T0.getTime() + 1000) });
    expect(fresh.outcome).toBe("pending");
    expect(verify).not.toHaveBeenCalled();
    const r = await processTopupCallback({ authority: AUTH1, now: later });
    expect(r.outcome).toBe("success");
    expect(t.processingToken).toBeNull();
    expect(bal("u1")).toBe(5000);
  });

  it("10: old worker cannot finalize after takeover and cannot double-credit", async () => {
    addTopup("t1", "u1", 5000, AUTH1);
    let release!: (v: unknown) => void;
    verify.mockImplementationOnce(() => new Promise((r) => { release = r; }));
    const oldWorker = processTopupCallback({ authority: AUTH1, now: T0 });
    await vi.waitFor(() => expect(topups.get("t1")!.status).toBe("processing"));
    verify.mockResolvedValueOnce({ success: true, refId: 222, cardPan: null });
    const newWorker = await processTopupCallback({ authority: AUTH1, now: later });
    expect(newWorker.outcome).toBe("success");
    release(OK);
    expect((await oldWorker).outcome).toBe("success");
    expect(topups.get("t1")!.refId).toBe(222);
    expect(bal("u1")).toBe(5000);
    expect(txs).toHaveLength(1);
  });

  it("11: DB failure before credit is safely retryable", async () => {
    addTopup("t1", "u1", 5000, AUTH1);
    verify.mockResolvedValue(OK);
    hooks.failWalletUpdateOnce = true;
    await expect(processTopupCallback({ authority: AUTH1, now: T0 })).rejects.toThrow();
    expect(bal("u1")).toBe(0);
    const r = await processTopupCallback({ authority: AUTH1, now: later });
    expect(r.outcome).toBe("success");
    expect(bal("u1")).toBe(5000);
    expect(txs).toHaveLength(1);
  });

  it("12: failure between balance update and transaction row: no duplicate, no lost credit", async () => {
    addTopup("t1", "u1", 5000, AUTH1);
    verify.mockResolvedValue(OK);
    hooks.failTxCreateOnce = true;
    await expect(processTopupCallback({ authority: AUTH1, now: T0 })).rejects.toThrow();
    expect(bal("u1")).toBe(5000);
    expect(txs).toHaveLength(0);
    const r = await processTopupCallback({ authority: AUTH1, now: later });
    expect(r.outcome).toBe("success");
    expect(bal("u1")).toBe(5000);
    expect(txs).toHaveLength(1);
    expect(txs[0].idempotencyKey).toBe("topup-credit:t1");
  });

  it("13: crash after credit but before final status is recoverable", async () => {
    addTopup("t1", "u1", 5000, AUTH1);
    verify.mockResolvedValue(OK);
    hooks.failPaidFinalizeOnce = true;
    await expect(processTopupCallback({ authority: AUTH1, now: T0 })).rejects.toThrow();
    expect(bal("u1")).toBe(5000);
    expect(topups.get("t1")!.status).toBe("processing");
    const r = await processTopupCallback({ authority: AUTH1, now: later });
    expect(r.outcome).toBe("success");
    expect(bal("u1")).toBe(5000);
    expect(txs).toHaveLength(1);
    expect(topups.get("t1")!.status).toBe("paid");
  });

  it("14: two top-ups of the same user each credit once", async () => {
    addTopup("t1", "u1", 5000, AUTH1);
    addTopup("t2", "u1", 3000, AUTH2);
    verify.mockResolvedValue(OK);
    await Promise.all([
      processTopupCallback({ authority: AUTH1, now: T0 }),
      processTopupCallback({ authority: AUTH2, now: T0 }),
      processTopupCallback({ authority: AUTH1, now: T0 }),
    ]);
    expect(bal("u1")).toBe(8000);
    expect(txs).toHaveLength(2);
  });

  it("15: top-ups of different users hit only their own wallet", async () => {
    addTopup("t1", "u1", 5000, AUTH1);
    addTopup("t2", "u2", 3000, AUTH2);
    verify.mockResolvedValue(OK);
    await processTopupCallback({ authority: AUTH2, now: T0 });
    expect(bal("u1")).toBe(0);
    expect(bal("u2")).toBe(3000);
    expect(topups.get("t1")!.status).toBe("pending");
  });
});
