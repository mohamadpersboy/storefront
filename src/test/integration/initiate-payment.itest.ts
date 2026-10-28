import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import mongoose from "mongoose";

// فقط درخواست درگاه Mock می‌شود. پایگاه داده واقعی (محلی، Replica Set) است.
vi.mock("@/lib/payment/zarinpal", async (orig) => {
  const actual = await orig<typeof import("@/lib/payment/zarinpal")>();
  return { ...actual, requestZarinpalPayment: vi.fn() };
});

import { connectToDatabase } from "@/lib/db/connect";
import { requestZarinpalPayment } from "@/lib/payment/zarinpal";
import { initiateOrderPayment } from "@/lib/payment/initiate-order-payment";
import { adjustWalletBalance } from "@/lib/wallet/wallet-service";
import { Order } from "@/models/Order";
import { Payment } from "@/models/Payment";
import { User } from "@/models/User";
import { Wallet } from "@/models/Wallet";
import { WalletTransaction } from "@/models/WalletTransaction";

const request = vi.mocked(requestZarinpalPayment);
const userIds: mongoose.Types.ObjectId[] = [];
const orderIds: mongoose.Types.ObjectId[] = [];
let seq = 0;

async function makeOrderWithWallet(walletBalance: number, prepayment = 1000) {
  const user = await User.create({ phoneNumber: `0991${String(Date.now()).slice(-6)}${seq++}`.slice(0, 11) });
  userIds.push(user._id);
  if (walletBalance > 0) {
    await adjustWalletBalance({
      userId: String(user._id),
      type: "credit",
      amount: walletBalance,
      reason: "itest",
      performedBy: String(user._id),
    });
  }
  const order = await Order.create({
    orderNumber: 900_000_000 + Math.floor(Math.random() * 99_999_999),
    customer: user._id,
    items: [
      { product: new mongoose.Types.ObjectId(), variantId: new mongoose.Types.ObjectId(), title: "t", unit: "u", unitPrice: prepayment, quantity: 1, lineTotal: prepayment },
    ],
    shippingAddress: { recipientName: "ت", phoneNumber: "09120000000", province: "ت", city: "ت", addressLine: "آدرس", postalCode: "1234567890" },
    subtotal: prepayment,
    shippingCost: 0,
    totalAmount: prepayment,
    paymentMethod: "online",
    prepaymentPercent: 100,
    prepaymentAmount: prepayment,
    remainingAmount: 0,
    statusHistory: [{ status: "pending", changedAt: new Date(), changedBy: user._id, note: "" }],
  });
  orderIds.push(order._id);
  return { userId: String(user._id), orderId: String(order._id) };
}
const balanceOf = async (u: string) => (await Wallet.findOne({ user: u }).lean<{ balance: number } | null>())?.balance ?? 0;

beforeAll(async () => {
  await connectToDatabase();
  await Wallet.syncIndexes();
  await WalletTransaction.syncIndexes();
  await Payment.syncIndexes();
});
beforeEach(() => {
  request.mockReset();
  let n = 0;
  request.mockImplementation(async () => {
    await new Promise((r) => setTimeout(r, 20));
    const authority = `ITEST${Date.now()}${n++}${Math.random().toString(36).slice(2)}`.replace(/[^A-Za-z0-9]/g, "").padEnd(36, "0");
    return { authority, paymentUrl: `https://sandbox/${authority}` };
  });
});
afterAll(async () => {
  if (mongoose.connection.readyState === 1) {
    await Payment.deleteMany({ order: { $in: orderIds } });
    await Order.deleteMany({ _id: { $in: orderIds } });
    await WalletTransaction.deleteMany({ user: { $in: userIds } });
    await Wallet.deleteMany({ user: { $in: userIds } });
    await User.deleteMany({ _id: { $in: userIds } });
  }
  await mongoose.disconnect();
});

describe("Mongo واقعی: شروع پرداخت سفارش", () => {
  it("۱۰ شروع پرداخت هم‌زمان با کیف پول ← یک Payment، یک درخواست درگاه، یک کسر", async () => {
    const { userId, orderId } = await makeOrderWithWallet(400);
    const results = await Promise.allSettled(
      Array.from({ length: 10 }, () => initiateOrderPayment({ orderId, initiatedByUserId: userId, useWallet: true })),
    );
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(request).toHaveBeenCalledTimes(1);
    expect(await Payment.countDocuments({ order: orderId })).toBe(1);
    expect(await balanceOf(userId)).toBe(0);
    expect(await WalletTransaction.countDocuments({ user: userId, type: "debit" })).toBe(1);
  });

  it("رد درگاه ← سهم کیف پول دقیقاً یک‌بار برمی‌گردد و Payment ساخته نمی‌شود", async () => {
    const { userId, orderId } = await makeOrderWithWallet(400);
    request.mockResolvedValue({ code: -9, message: "rejected" });
    await expect(initiateOrderPayment({ orderId, initiatedByUserId: userId, useWallet: true })).rejects.toMatchObject({ status: 502 });
    expect(await balanceOf(userId)).toBe(400);
    expect(await Payment.countDocuments({ order: orderId })).toBe(0);
    expect(await WalletTransaction.countDocuments({ user: userId, type: "credit", idempotencyKey: { $regex: "^payment-refund:" } })).toBe(1);
  });

  it("Payment پرداخت‌شده‌ی ترکیبی (amount + walletAmount) ← پرداخت دوباره ممکن نیست", async () => {
    const { userId, orderId } = await makeOrderWithWallet(400);
    await Payment.create({
      order: orderId, amount: 600, walletAmount: 400, provider: "zarinpal", status: "paid",
      authority: `ITESTPAID${Date.now()}${seq++}`.padEnd(36, "0"), description: "x", initiatedBy: userId, paidAt: new Date(),
    });
    await expect(initiateOrderPayment({ orderId, initiatedByUserId: userId, useWallet: true })).rejects.toMatchObject({ status: 409 });
    expect(request).not.toHaveBeenCalled();
    expect(await balanceOf(userId)).toBe(400);
  });

  it("تکرار بعد از موفقیت ← همان Payment باز استفاده می‌شود و کسر دوباره نیست", async () => {
    const { userId, orderId } = await makeOrderWithWallet(400);
    await initiateOrderPayment({ orderId, initiatedByUserId: userId, useWallet: true });
    const again = await initiateOrderPayment({ orderId, initiatedByUserId: userId, useWallet: true });
    expect(again.reused).toBe(true);
    expect(request).toHaveBeenCalledTimes(1);
    expect(await balanceOf(userId)).toBe(0);
  });

  it("کیف پول کل مبلغ را می‌پوشاند ← بدون درگاه، Payment پرداخت‌شده، یک کسر", async () => {
    const { userId, orderId } = await makeOrderWithWallet(5000);
    const results = await Promise.allSettled(
      Array.from({ length: 6 }, () => initiateOrderPayment({ orderId, initiatedByUserId: userId, useWallet: true })),
    );
    expect(request).not.toHaveBeenCalled();
    expect(await Payment.countDocuments({ order: orderId, status: "paid" })).toBe(1);
    expect(await balanceOf(userId)).toBe(4000);
    expect(results.filter((r) => r.status === "fulfilled").length).toBeGreaterThanOrEqual(1);
  });
});
