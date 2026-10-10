import type { ClientSession, Types } from "mongoose";
import { Wallet, type WalletDocument } from "@/models/Wallet";
import { WalletTransaction } from "@/models/WalletTransaction";
import { checkWalletAdjustment, type WalletTransactionType } from "@/lib/wallet/check-wallet-adjustment";

export class WalletAdjustmentError extends Error {}

export async function getOrCreateWallet(userId: string): Promise<WalletDocument> {
  let wallet = await Wallet.findOne({ user: userId });
  if (!wallet) {
    try {
      wallet = await Wallet.create({ user: userId, balance: 0 });
    } catch (error) {
      // ساخت هم‌زمان اولین کیف پول: Unique Index روی `user` یکی را رد می‌کند.
      if ((error as { code?: number })?.code !== 11000) throw error;
      wallet = await Wallet.findOne({ user: userId });
      if (!wallet) throw error;
    }
  }
  return wallet;
}

/**
 * تعدیل موجودی — دو مسیر واقعی به این تابع می‌رسند: (۱) تعدیل دستی
 * ادمین از داشبورد (بدون درگاه، طبق تصمیم اولیه کارفرما) و (۲) شارژ
 * خودکار از طریق درگاه بعد از Verify موفق زرین‌پال
 * (`wallet/topup/callback`) و کسر/استرداد کیف پول در پرداخت سفارش
 * (`initiate-order-payment.ts`). با `findOneAndUpdate` و `$inc` به‌صورت
 * Atomic روی خود Mongo انجام می‌شود — برای Debit، شرط
 * `balance >= amount` هم *داخل همان Query* است، نه یک چک جداگانه
 * قبل از نوشتن؛ یعنی حتی اگر دو تعدیل هم‌زمان روی یک کیف پول اجرا
 * شوند، هرگز موجودی منفی نمی‌شود (Race Condition اینجا از نظر
 * ساختاری غیرممکن است، نه فقط بررسی‌شده).
 */
async function createTransactionRow(
  row: {
    wallet: Types.ObjectId;
    userId: string;
    type: WalletTransactionType;
    amount: number;
    balanceAfter: number;
    reason: string;
    performedBy: string;
    idempotencyKey?: string;
  },
  session: ClientSession | null,
): Promise<void> {
  try {
    await WalletTransaction.create(
      [
        {
          wallet: row.wallet,
          user: row.userId,
          type: row.type,
          amount: row.amount,
          balanceAfter: row.balanceAfter,
          reason: row.reason,
          performedBy: row.performedBy,
          ...(row.idempotencyKey ? { idempotencyKey: row.idempotencyKey } : {}),
        },
      ],
      session ? { session } : undefined,
    );
  } catch (error) {
    // کلید تکراری = همین عملیات را کار هم‌زمان دیگری ثبت کرده؛ اثر مالی یکی است.
    if (row.idempotencyKey && (error as { code?: number })?.code === 11000 && !session) return;
    throw error;
  }
}

export async function adjustWalletBalance(params: {
  userId: string;
  type: WalletTransactionType;
  amount: number;
  reason: string;
  performedBy: string;
  /**
   * هویت مالی یکتا برای تعدیلی که نباید دو بار اعمال شود. اگر ردیفی با
   * همین کلید قبلاً ثبت شده باشد، هیچ تغییری اعمال نمی‌شود و کیف پول
   * فعلی برگردانده می‌شود (نتیجه یکسان، بدون اثر مالی دوباره).
   */
  idempotencyKey?: string;
  /**
   * اگر داده شود، افزایش موجودی و ثبت ردیف تراکنش در همان Transaction
   * انجام می‌شود (همه یا هیچ). بدون Session، رفتار قبلی حفظ می‌شود.
   */
  session?: ClientSession | null;
}) {
  const { userId, type, amount, reason, performedBy, idempotencyKey } = params;
  const session = params.session ?? null;

  const wallet = await getOrCreateWallet(userId);

  if (idempotencyKey) {
    const existing = await WalletTransaction.findOne({ idempotencyKey })
      .session(session)
      .select("_id")
      .lean();
    if (existing) return wallet;
  }

  const check = checkWalletAdjustment(wallet.balance, type, amount);
  if (!check.ok) {
    throw new WalletAdjustmentError(check.reason ?? "تعدیل نامعتبر است");
  }

  const delta = type === "credit" ? amount : -amount;
  const filter: Record<string, unknown> =
    type === "debit" ? { user: userId, balance: { $gte: amount } } : { user: userId };
  // تغییر موجودی و ثبت کلید عملیات در «یک» نوشتن اتمیک روی سند Wallet
  // انجام می‌شود؛ پس حتی بدون Transaction، تکرار هرگز دوباره موجودی را
  // زیاد نمی‌کند، و کرش بعد از آن با ساخت ردیف تراکنش جاافتاده ترمیم می‌شود.
  if (idempotencyKey) filter.appliedOperationKeys = { $ne: idempotencyKey };

  const update: Record<string, unknown> = { $inc: { balance: delta } };
  if (idempotencyKey) update.$push = { appliedOperationKeys: idempotencyKey };

  const updated = await Wallet.findOneAndUpdate(filter, update, {
    new: true,
    ...(session ? { session } : {}),
  });

  if (!updated) {
    if (idempotencyKey) {
      const applied = await Wallet.findOne({
        user: userId,
        appliedOperationKeys: idempotencyKey,
      })
        .session(session)
        .lean();
      if (applied) {
        // اثر مالی قبلاً اعمال شده؛ فقط ردیف تراکنش را (اگر نیست) ترمیم کن.
        await createTransactionRow(
          { wallet: applied._id, userId, type, amount, balanceAfter: applied.balance, reason, performedBy, idempotencyKey },
          session,
        );
        return (await getOrCreateWallet(userId)) as WalletDocument;
      }
    }
    // بین چک بالا و همین لحظه، یک درخواست هم‌زمان دیگر موجودی را
    // کم کرده — همان چیزی که شرط Atomic بالا برایش طراحی شده.
    throw new WalletAdjustmentError("موجودی کیف پول کافی نیست (تغییر هم‌زمان رخ داد)");
  }

  await createTransactionRow(
    { wallet: updated._id, userId, type, amount, balanceAfter: updated.balance, reason, performedBy, idempotencyKey },
    session,
  );

  return updated;
}
