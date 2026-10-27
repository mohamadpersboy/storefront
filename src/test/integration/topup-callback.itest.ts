import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import mongoose from "mongoose";

// فقط درگاه Mock می‌شود. پایگاه داده واقعی (محلی، Replica Set) است.
vi.mock("@/lib/payment/zarinpal", async (orig) => {
  const actual = await orig<typeof import("@/lib/payment/zarinpal")>();
  return { ...actual, verifyZarinpalPayment: vi.fn() };
});

import { connectToDatabase } from "@/lib/db/connect";
import { verifyZarinpalPayment } from "@/lib/payment/zarinpal";
import { Wallet } from "@/models/Wallet";
import { WalletTransaction } from "@/models/WalletTransaction";
import { WalletTopup } from "@/models/WalletTopup";
import { WithdrawalRequest } from "@/models/WithdrawalRequest";
import { processTopupCallback, topupCreditKey } from "@/lib/wallet/process-topup-callback";
import { reviewWithdrawal, withdrawalRefundKey } from "@/lib/wallet/review-withdrawal";
import { adjustWalletBalance } from "@/lib/wallet/wallet-service";

const verify = vi.mocked(verifyZarinpalPayment);
const newId = () => new mongoose.Types.ObjectId().toString();
const users: string[] = [];
const authorities: string[] = [];
const makeUser = () => {
  const id = newId();
  users.push(id);
  return id;
};
let seq = 0;
const makeAuthority = () => {
  const a = `ITEST${Date.now()}${seq++}`.padEnd(36, "0");
  authorities.push(a);
  return a;
};
const balanceOf = async (user: string) =>
  (await Wallet.findOne({ user }).lean<{ balance: number } | null>())?.balance ?? 0;

beforeAll(async () => {
  await connectToDatabase();
  await Wallet.syncIndexes();
  await WalletTransaction.syncIndexes();
  await WalletTopup.syncIndexes();
});

afterAll(async () => {
  if (mongoose.connection.readyState === 1) {
    await Wallet.deleteMany({ user: { $in: users } });
    await WalletTransaction.deleteMany({ user: { $in: users } });
    await WalletTopup.deleteMany({ authority: { $in: authorities } });
    await WithdrawalRequest.deleteMany({ user: { $in: users } });
  }
  await mongoose.disconnect();
});

describe("Mongo واقعی: Callback شارژ کیف پول", () => {
  it("۱۰ Callback هم‌زمان برای یک Authority ← فقط یک اعتبار", async () => {
    const user = makeUser();
    const authority = makeAuthority();
    const topup = await WalletTopup.create({
      user,
      amount: 50000,
      authority,
      description: "itest",
    });
    verify.mockResolvedValue({ success: true, refId: 1, cardPan: null } as never);

    const results = await Promise.all(
      Array.from({ length: 10 }, () => processTopupCallback({ authority })),
    );

    expect(results.every((r) => r.outcome === "success" || r.outcome === "pending")).toBe(true);
    expect(await balanceOf(user)).toBe(50000);
    const txs = await WalletTransaction.find({ idempotencyKey: topupCreditKey(topup._id) });
    expect(txs).toHaveLength(1);
    expect((await WalletTopup.findById(topup._id))?.status).toBe("paid");
  });

  it("Callback تکراری بعد از موفقیت ← اعتبار دوباره نمی‌شود", async () => {
    const user = makeUser();
    const authority = makeAuthority();
    await WalletTopup.create({ user, amount: 20000, authority, description: "itest" });
    verify.mockResolvedValue({ success: true, refId: 2, cardPan: null } as never);

    expect((await processTopupCallback({ authority })).outcome).toBe("success");
    expect((await processTopupCallback({ authority })).outcome).toBe("success");
    expect(await balanceOf(user)).toBe(20000);
  });

  it("Verify ناموفق (خطای موقت) ← اعتبار نمی‌شود و رکورد failed نمی‌شود", async () => {
    const user = makeUser();
    const authority = makeAuthority();
    const topup = await WalletTopup.create({ user, amount: 30000, authority, description: "itest" });
    verify.mockResolvedValue({ success: false, code: 0, message: "timeout", retryable: true } as never);

    const r = await processTopupCallback({ authority });
    expect(r.outcome).not.toBe("success");
    expect(await balanceOf(user)).toBe(0);
    expect((await WalletTopup.findById(topup._id))?.status).not.toBe("failed");
  });

  it("Authority نامعتبر یا ناموجود ← error و بدون اثر مالی", async () => {
    expect((await processTopupCallback({ authority: "x" })).outcome).toBe("error");
    expect((await processTopupCallback({ authority: "N".repeat(36) })).outcome).toBe("error");
  });
});

describe("Mongo واقعی: رد درخواست برداشت", () => {
  const makeWithdrawal = async (user: string, amount: number) => {
    // مبلغ هنگام ثبت درخواست از کیف پول کسر شده است.
    await adjustWalletBalance({
      userId: user,
      type: "credit",
      amount,
      reason: "itest seed",
      performedBy: newId(),
    });
    await adjustWalletBalance({
      userId: user,
      type: "debit",
      amount,
      reason: "itest withdrawal",
      performedBy: newId(),
    });
    return WithdrawalRequest.create({
      user,
      amount,
      destination: { ownerName: "تست", cardNumber: "6037997000000000", iban: null },
    });
  };

  it("۱۰ رد هم‌زمان ← فقط یک استرداد", async () => {
    const user = makeUser();
    const w = await makeWithdrawal(user, 40000);
    expect(await balanceOf(user)).toBe(0);

    const results = await Promise.all(
      Array.from({ length: 10 }, () =>
        reviewWithdrawal({ id: String(w._id), action: "reject", note: null, actorId: newId() }),
      ),
    );

    expect(results.filter((r) => r.kind === "ok").length).toBeLessThanOrEqual(1);
    expect(await balanceOf(user)).toBe(40000);
    const refunds = await WalletTransaction.find({ idempotencyKey: withdrawalRefundKey(w._id) });
    expect(refunds).toHaveLength(1);
  });

  it("رد دوباره بعد از رد موفق ← conflict و بدون استرداد دوم", async () => {
    const user = makeUser();
    const w = await makeWithdrawal(user, 10000);
    const first = await reviewWithdrawal({ id: String(w._id), action: "reject", note: null, actorId: newId() });
    expect(first.kind).toBe("ok");
    const second = await reviewWithdrawal({ id: String(w._id), action: "reject", note: null, actorId: newId() });
    expect(second.kind).toBe("conflict");
    expect(await balanceOf(user)).toBe(10000);
    expect((await WithdrawalRequest.findById(w._id))?.status).toBe("rejected");
  });

  it("تأیید و رد هم‌زمان ← فقط یکی برنده می‌شود و پول سالم می‌ماند", async () => {
    const user = makeUser();
    const w = await makeWithdrawal(user, 25000);
    const [a, r] = await Promise.all([
      reviewWithdrawal({ id: String(w._id), action: "approve", note: null, actorId: newId() }),
      reviewWithdrawal({ id: String(w._id), action: "reject", note: null, actorId: newId() }),
    ]);
    const final = (await WithdrawalRequest.findById(w._id))?.status;
    const bal = await balanceOf(user);
    // یا تأیید شده و استرداد نشده؛ یا رد شده و کامل استرداد شده. حالت میانی ممنوع.
    if (final === "approved_paid") expect(bal).toBe(0);
    else if (final === "rejected") expect(bal).toBe(25000);
    else expect.fail(`وضعیت نهایی غیرمنتظره: ${final} (${a.kind}/${r.kind})`);
  });
});
