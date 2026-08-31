import { Wallet, type WalletDocument } from "@/models/Wallet";
import { WalletTransaction } from "@/models/WalletTransaction";
import { checkWalletAdjustment, type WalletTransactionType } from "@/lib/wallet/check-wallet-adjustment";

export class WalletAdjustmentError extends Error {}

export async function getOrCreateWallet(userId: string): Promise<WalletDocument> {
  let wallet = await Wallet.findOne({ user: userId });
  if (!wallet) {
    wallet = await Wallet.create({ user: userId, balance: 0 });
  }
  return wallet;
}

/**
 * تعدیل دستی موجودی توسط ادمین (نسخه ساده — بدون درگاه پرداخت، طبق
 * تصمیم صریح کارفرما). با `findOneAndUpdate` و `$inc` به‌صورت
 * Atomic روی خود Mongo انجام می‌شود — برای Debit، شرط
 * `balance >= amount` هم *داخل همان Query* است، نه یک چک جداگانه
 * قبل از نوشتن؛ یعنی حتی اگر دو تعدیل هم‌زمان روی یک کیف پول اجرا
 * شوند، هرگز موجودی منفی نمی‌شود (Race Condition اینجا از نظر
 * ساختاری غیرممکن است، نه فقط بررسی‌شده).
 */
export async function adjustWalletBalance(params: {
  userId: string;
  type: WalletTransactionType;
  amount: number;
  reason: string;
  performedBy: string;
}) {
  const { userId, type, amount, reason, performedBy } = params;

  const wallet = await getOrCreateWallet(userId);
  const check = checkWalletAdjustment(wallet.balance, type, amount);
  if (!check.ok) {
    throw new WalletAdjustmentError(check.reason ?? "تعدیل نامعتبر است");
  }

  const delta = type === "credit" ? amount : -amount;
  const filter =
    type === "debit" ? { user: userId, balance: { $gte: amount } } : { user: userId };

  const updated = await Wallet.findOneAndUpdate(
    filter,
    { $inc: { balance: delta } },
    { new: true },
  );

  if (!updated) {
    // بین چک بالا و همین لحظه، یک درخواست هم‌زمان دیگر موجودی را
    // کم کرده — همان چیزی که شرط Atomic بالا برایش طراحی شده.
    throw new WalletAdjustmentError("موجودی کیف پول کافی نیست (تغییر هم‌زمان رخ داد)");
  }

  await WalletTransaction.create({
    wallet: updated._id,
    user: userId,
    type,
    amount,
    balanceAfter: updated.balance,
    reason,
    performedBy,
  });

  return updated;
}
