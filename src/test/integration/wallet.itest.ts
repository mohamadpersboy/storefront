import { afterAll, beforeAll, describe, expect, it } from "vitest";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db/connect";
import { runInTransaction } from "@/lib/db/transaction";
import { Wallet } from "@/models/Wallet";
import { WalletTransaction } from "@/models/WalletTransaction";
import { adjustWalletBalance, getOrCreateWallet } from "@/lib/wallet/wallet-service";

const newId = () => new mongoose.Types.ObjectId().toString();
const admin = newId();
const users: string[] = [];
const makeUser = () => {
  const id = newId();
  users.push(id);
  return id;
};

beforeAll(async () => {
  await connectToDatabase();
  await Wallet.syncIndexes();
  await WalletTransaction.syncIndexes();
});

afterAll(async () => {
  await Wallet.deleteMany({ user: { $in: users } });
  await WalletTransaction.deleteMany({ user: { $in: users } });
  await mongoose.disconnect();
});

describe("Mongo واقعی: زیرساخت", () => {
  it("اتصال به Replica Set برقرار است", async () => {
    const hello = await mongoose.connection.db!.admin().command({ hello: 1 });
    expect(hello.setName).toBe("rs0");
  });

  it("Transaction واقعی کار می‌کند (Session خالی نیست)", async () => {
    let gotSession = false;
    await runInTransaction(async (session) => {
      gotSession = session !== null;
    });
    expect(gotSession).toBe(true);
  });

  it("Index یکتای جزئی WalletTransaction.idempotencyKey وجود دارد", async () => {
    const idx = await WalletTransaction.collection.indexes();
    const found = idx.find((i) => i.key?.idempotencyKey === 1);
    expect(found?.unique).toBe(true);
    expect(found?.partialFilterExpression).toBeTruthy();
  });

  it("Index یکتای Wallet.user وجود دارد", async () => {
    const idx = await Wallet.collection.indexes();
    expect(idx.find((i) => i.key?.user === 1)?.unique).toBe(true);
  });
});

describe("Mongo واقعی: هم‌زمانی کیف پول", () => {
  it("۱۰ ساخت هم‌زمان کیف پول فقط یک کیف پول می‌سازد", async () => {
    const user = makeUser();
    await Promise.all(Array.from({ length: 10 }, () => getOrCreateWallet(user)));
    expect(await Wallet.countDocuments({ user })).toBe(1);
  });

  it("۱۰ کسر هم‌زمان ۳۰تایی از ۱۰۰ → دقیقاً ۳ موفق، موجودی ۱۰", async () => {
    const user = makeUser();
    await adjustWalletBalance({ userId: user, type: "credit", amount: 100, reason: "seed", performedBy: admin });
    const results = await Promise.allSettled(
      Array.from({ length: 10 }, () =>
        adjustWalletBalance({ userId: user, type: "debit", amount: 30, reason: "race", performedBy: admin }),
      ),
    );
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(3);
    const wallet = await Wallet.findOne({ user }).lean();
    expect(wallet?.balance).toBe(10);
  });

  it("۱۰ اعتبار هم‌زمان با یک کلید → یک بار اعمال می‌شود", async () => {
    const user = makeUser();
    await Promise.allSettled(
      Array.from({ length: 10 }, () =>
        adjustWalletBalance({
          userId: user,
          type: "credit",
          amount: 50,
          reason: "idem",
          performedBy: admin,
          idempotencyKey: `itest-credit:${user}`,
        }),
      ),
    );
    const wallet = await Wallet.findOne({ user }).lean();
    expect(wallet?.balance).toBe(50);
    expect(await WalletTransaction.countDocuments({ user, idempotencyKey: `itest-credit:${user}` })).toBe(1);
  });

  it("تکرار با Session (Transaction) هم اثر دوباره ندارد", async () => {
    const user = makeUser();
    const key = `itest-tx:${user}`;
    for (let i = 0; i < 3; i++) {
      await runInTransaction((session) =>
        adjustWalletBalance({ userId: user, type: "credit", amount: 20, reason: "tx", performedBy: admin, idempotencyKey: key, session }),
      );
    }
    expect((await Wallet.findOne({ user }).lean())?.balance).toBe(20);
    expect(await WalletTransaction.countDocuments({ user, idempotencyKey: key })).toBe(1);
  });
});
