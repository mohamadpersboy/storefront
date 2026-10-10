/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Fake Store اتمیک در حافظه. این تست‌ها منطق Claim/Idempotency/Recovery را
 * اثبات می‌کنند، نه هم‌زمانی/Transaction/Unique Index واقعی MongoDB (NOT VERIFIED).
 */
type W = {
  _id: string; user: string; amount: number; status: string;
  rejectionStartedAt: Date | null; reviewedBy: unknown; reviewNote: string | null; reviewedAt: Date | null;
};
type WalletRow = { _id: string; user: string; balance: number; appliedOperationKeys: string[] };

const withdrawals = new Map<string, W>();
const wallets = new Map<string, WalletRow>();
const txs: { idempotencyKey?: string; user: string; amount: number }[] = [];
const hooks = { failWalletUpdateOnce: false, failTxCreateOnce: false, failFinalizeOnce: false };

function q<T>(get: () => T) {
  const o = {
    session: () => o, select: () => o, lean: async () => get(),
    then: (res: (v: T) => unknown, rej?: (e: unknown) => unknown) => Promise.resolve(get()).then(res, rej),
  };
  return o;
}

vi.mock("@/lib/db/transaction", () => ({ runInTransaction: (fn: (s: null) => unknown) => fn(null) }));

vi.mock("@/models/WithdrawalRequest", () => ({
  WithdrawalRequest: {
    findById: (id: string) => q(() => withdrawals.get(id) ?? null),
    findOneAndUpdate: (f: any, u: { $set: Record<string, any> }) => {
      if (u.$set.status === "rejected" && hooks.failFinalizeOnce) {
        hooks.failFinalizeOnce = false;
        return { select: () => ({ lean: async () => { throw new Error("db down"); } }) };
      }
      const w = withdrawals.get(f._id);
      const match =
        !!w && w.status === f.status && (!("rejectionStartedAt" in f) || w.rejectionStartedAt === f.rejectionStartedAt);
      if (match) Object.assign(w!, u.$set);
      return q(() => (match ? w : null));
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

import { reviewWithdrawal, withdrawalRefundKey } from "@/lib/wallet/review-withdrawal";

const ID1 = "64b000000000000000000001";
const ID2 = "64b000000000000000000002";
const T0 = new Date("2026-01-01T00:00:00Z");

function add(id: string, user: string, amount: number, status = "pending") {
  withdrawals.set(id, { _id: id, user, amount, status, rejectionStartedAt: null, reviewedBy: null, reviewNote: null, reviewedAt: null });
  if (![...wallets.values()].some((w) => w.user === user)) {
    wallets.set(`w-${user}`, { _id: `w-${user}`, user, balance: 0, appliedOperationKeys: [] });
  }
}
const bal = (u: string) => wallets.get(`w-${u}`)!.balance;
const reject = (id = ID1) => reviewWithdrawal({ id, action: "reject", note: null, actorId: "admin", now: T0 });
const approve = (id = ID1) => reviewWithdrawal({ id, action: "approve", note: null, actorId: "admin", now: T0 });

beforeEach(() => {
  withdrawals.clear(); wallets.clear(); txs.length = 0;
  hooks.failWalletUpdateOnce = false; hooks.failTxCreateOnce = false; hooks.failFinalizeOnce = false;
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("reviewWithdrawal — reject", () => {
  it("1: reject refunds exactly once and finalizes", async () => {
    add(ID1, "u1", 5000);
    const r = await reject();
    expect(r.kind).toBe("ok");
    expect(bal("u1")).toBe(5000);
    expect(txs).toHaveLength(1);
    expect(txs[0].idempotencyKey).toBe(withdrawalRefundKey(ID1));
    expect(withdrawals.get(ID1)!.status).toBe("rejected");
  });

  it("2: repeated reject does not refund again", async () => {
    add(ID1, "u1", 5000);
    await reject();
    const r = await reject();
    expect(r.kind).toBe("conflict");
    expect(bal("u1")).toBe(5000);
    expect(txs).toHaveLength(1);
  });

  it("3: two concurrent rejects refund once", async () => {
    add(ID1, "u1", 5000);
    const [a, b] = await Promise.all([reject(), reject()]);
    expect([a.kind, b.kind].sort()).toEqual(["conflict", "ok"]);
    expect(bal("u1")).toBe(5000);
    expect(txs).toHaveLength(1);
    expect(withdrawals.get(ID1)!.status).toBe("rejected");
  });

  it("4: failure before refund keeps pending, no money moves, retry works", async () => {
    add(ID1, "u1", 5000);
    hooks.failWalletUpdateOnce = true;
    const r = await reject();
    expect(r.kind).toBe("retry_later");
    expect(bal("u1")).toBe(0);
    expect(withdrawals.get(ID1)!.status).toBe("pending");
    const r2 = await reject();
    expect(r2.kind).toBe("ok");
    expect(bal("u1")).toBe(5000);
  });

  it("5: failure after refund, before final status — retry finalizes without second refund", async () => {
    add(ID1, "u1", 5000);
    hooks.failFinalizeOnce = true;
    const r = await reject();
    expect(r.kind).toBe("retry_later");
    expect(bal("u1")).toBe(5000);
    expect(withdrawals.get(ID1)!.status).toBe("pending");
    const r2 = await reject();
    expect(r2.kind).toBe("ok");
    expect(bal("u1")).toBe(5000);
    expect(txs).toHaveLength(1);
    expect(withdrawals.get(ID1)!.status).toBe("rejected");
  });

  it("6: retry after temporary error (several failures) refunds once", async () => {
    add(ID1, "u1", 5000);
    hooks.failFinalizeOnce = true;
    await reject();
    hooks.failFinalizeOnce = true;
    await reject();
    const r = await reject();
    expect(r.kind).toBe("ok");
    expect(bal("u1")).toBe(5000);
  });

  it("10: recovers half-done refund (balance applied, transaction row missing)", async () => {
    add(ID1, "u1", 5000);
    hooks.failTxCreateOnce = true; // کرش بعد از $inc، پیش از ردیف تراکنش
    const r = await reject();
    expect(r.kind).toBe("retry_later");
    expect(bal("u1")).toBe(5000);
    expect(txs).toHaveLength(0);
    const r2 = await reject();
    expect(r2.kind).toBe("ok");
    expect(bal("u1")).toBe(5000);
    expect(txs).toHaveLength(1);
    expect(withdrawals.get(ID1)!.status).toBe("rejected");
  });

  it("7: same idempotency key twice credits once", async () => {
    add(ID1, "u1", 5000);
    wallets.get("w-u1")!.appliedOperationKeys.push(withdrawalRefundKey(ID1));
    wallets.get("w-u1")!.balance = 5000; // اعتبار قبلاً اعمال شده
    const r = await reject();
    expect(r.kind).toBe("ok");
    expect(bal("u1")).toBe(5000);
  });

  it("9: other user's wallet is untouched", async () => {
    add(ID1, "u1", 5000);
    add(ID2, "u2", 7000);
    await reject(ID1);
    expect(bal("u1")).toBe(5000);
    expect(bal("u2")).toBe(0);
    expect(withdrawals.get(ID2)!.status).toBe("pending");
  });
});

describe("reviewWithdrawal — approve / invalid", () => {
  it("approve changes status only, no balance change", async () => {
    add(ID1, "u1", 5000);
    const r = await approve();
    expect(r.kind).toBe("ok");
    expect(withdrawals.get(ID1)!.status).toBe("approved_paid");
    expect(bal("u1")).toBe(0);
    expect(txs).toHaveLength(0);
  });

  it("8: non-pending (approved) cannot be rejected or refunded", async () => {
    add(ID1, "u1", 5000, "approved_paid");
    const r = await reject();
    expect(r.kind).toBe("conflict");
    expect(bal("u1")).toBe(0);
  });

  it("8b: rejected cannot be approved", async () => {
    add(ID1, "u1", 5000);
    await reject();
    const r = await approve();
    expect(r.kind).toBe("conflict");
    expect(withdrawals.get(ID1)!.status).toBe("rejected");
  });

  it("approve is blocked after a reject has started (half-done)", async () => {
    add(ID1, "u1", 5000);
    hooks.failFinalizeOnce = true;
    await reject();
    const a = await approve();
    expect(a.kind).toBe("conflict");
    expect(withdrawals.get(ID1)!.status).toBe("pending");
    const r = await reject();
    expect(r.kind).toBe("ok");
    expect(bal("u1")).toBe(5000);
  });

  it("concurrent approve and reject never both succeed", async () => {
    add(ID1, "u1", 5000);
    const [a, r] = await Promise.all([approve(), reject()]);
    const oks = [a.kind, r.kind].filter((k) => k === "ok");
    expect(oks).toHaveLength(1);
    const st = withdrawals.get(ID1)!.status;
    expect(bal("u1")).toBe(st === "rejected" ? 5000 : 0);
  });

  it("invalid and missing ids return not_found", async () => {
    expect((await reject("bad-id")).kind).toBe("not_found");
    expect((await reject(ID2)).kind).toBe("not_found");
  });
});
