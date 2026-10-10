import { beforeEach, describe, expect, it, vi } from "vitest";

const keys = new Set<string>();
let balance = 0;
const created: unknown[] = [];

vi.mock("@/models/Wallet", () => ({
  Wallet: {
    findOne: async () => ({ _id: "w1", balance }),
    create: async () => ({ _id: "w1", balance }),
    findOneAndUpdate: async (_f: unknown, u: { $inc: { balance: number } }) => {
      balance += u.$inc.balance;
      return { _id: "w1", balance };
    },
  },
}));
vi.mock("@/models/WalletTransaction", () => ({
  WalletTransaction: {
    findOne: ({ idempotencyKey }: { idempotencyKey: string }) => {
      const q = { session: () => q, select: () => q, lean: async () => (keys.has(idempotencyKey) ? { _id: "t" } : null) };
      return q;
    },
    create: async (docs: { idempotencyKey?: string }[]) => {
      if (docs[0].idempotencyKey) keys.add(docs[0].idempotencyKey);
      created.push(docs[0]);
    },
  },
}));

import { adjustWalletBalance } from "@/lib/wallet/wallet-service";

beforeEach(() => { keys.clear(); balance = 0; created.length = 0; });

const credit = (idempotencyKey?: string) =>
  adjustWalletBalance({ userId: "u", type: "credit", amount: 500, reason: "r", performedBy: "u", idempotencyKey });

describe("adjustWalletBalance idempotency", () => {
  it("same key credits once", async () => {
    await credit("k1");
    await credit("k1");
    await credit("k1");
    expect(balance).toBe(500);
    expect(created).toHaveLength(1);
  });
  it("different keys and no key still apply normally", async () => {
    await credit("k1");
    await credit("k2");
    await credit();
    await credit();
    expect(balance).toBe(2000);
  });
});
