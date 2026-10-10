import { randomUUID } from "node:crypto";
import type { Types } from "mongoose";
import { WalletTopup, type WalletTopupStatus } from "@/models/WalletTopup";
import { verifyZarinpalPayment } from "@/lib/payment/zarinpal";
import { adjustWalletBalance } from "@/lib/wallet/wallet-service";
import { runInTransaction } from "@/lib/db/transaction";

/**
 * عمر Claim. محدودیت: این فقط یک Heuristic است، نه اثبات توقف Worker
 * قدیمی. امنیت مالی به آن وابسته نیست: اعتبار فقط با کلید یکتای
 * `topup-credit:<id>` اعمال می‌شود و Worker قدیمی بدون Token نمی‌تواند
 * نهایی کند.
 */
export const TOPUP_CLAIM_TTL_MS = 2 * 60 * 1000;

const AUTHORITY_PATTERN = /^[A-Za-z0-9]{10,64}$/;

export type TopupCallbackOutcome = "success" | "failed" | "pending" | "error";

export interface TopupCallbackResult {
  outcome: TopupCallbackOutcome;
  amount?: number;
}

interface TopupRow {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  amount: number;
  status: WalletTopupStatus;
}

export function topupCreditKey(topupId: unknown): string {
  return `topup-credit:${String(topupId)}`;
}

function settled(status: WalletTopupStatus): TopupCallbackOutcome | null {
  if (status === "paid") return "success";
  if (status === "failed") return "failed";
  return null;
}

/**
 * پردازش امن و Idempotent بازگشت از درگاه برای شارژ کیف پول (Phase 2).
 * Status/amount کلاینت نادیده گرفته می‌شود؛ همیشه Verify با درگاه روی
 * مبلغ ذخیره‌شده. اعتبار + نهایی‌سازی در یک Transaction (اگر پشتیبانی شود)؛
 * وگرنه اعتبار با کلید اتمیک روی Wallet اعمال می‌شود و ترتیب
 * «اعتبار، بعد paid» باعث می‌شود Retry بعد از کرش، همان اعتبار را
 * بدون اثر دوباره کامل کند.
 */
export async function processTopupCallback(params: {
  authority: string | null;
  now?: Date;
}): Promise<TopupCallbackResult> {
  const now = params.now ?? new Date();
  const { authority } = params;
  if (!authority || !AUTHORITY_PATTERN.test(authority)) return { outcome: "error" };

  const topup = await WalletTopup.findOne({ authority })
    .select("user amount status")
    .lean<TopupRow | null>();
  if (!topup) return { outcome: "error" };

  const done = settled(topup.status);
  if (done) return { outcome: done, amount: topup.amount };

  const token = randomUUID();
  const staleBefore = new Date(now.getTime() - TOPUP_CLAIM_TTL_MS);
  const claimed = await WalletTopup.findOneAndUpdate(
    {
      _id: topup._id,
      $or: [
        { status: "pending" },
        { status: "processing", processingStartedAt: { $lt: staleBefore } },
      ],
    },
    { $set: { status: "processing", processingToken: token, processingStartedAt: now } },
    { new: true },
  )
    .select("_id")
    .lean();

  const currentOutcome = async (): Promise<TopupCallbackResult> => {
    const cur = await WalletTopup.findById(topup._id)
      .select("status")
      .lean<{ status: WalletTopupStatus } | null>();
    const d = cur ? settled(cur.status) : null;
    return { outcome: d ?? "pending", amount: topup.amount };
  };

  if (!claimed) return currentOutcome();

  const verification = await verifyZarinpalPayment({ amount: topup.amount, authority });

  const owned = { _id: topup._id, status: "processing" as const, processingToken: token };
  const clear = { processingToken: null, processingStartedAt: null };

  if (!verification.success) {
    if (verification.retryable) {
      await WalletTopup.findOneAndUpdate(owned, { $set: { status: "pending", ...clear } });
      return { outcome: "pending", amount: topup.amount };
    }
    const failed = await WalletTopup.findOneAndUpdate(
      owned,
      { $set: { status: "failed", failureReason: verification.message, ...clear } },
      { new: true },
    )
      .select("_id")
      .lean();
    if (failed) return { outcome: "failed", amount: topup.amount };
    return currentOutcome();
  }

  const finalized = await runInTransaction(async (session) => {
    await adjustWalletBalance({
      userId: String(topup.user),
      type: "credit",
      amount: topup.amount,
      reason: `شارژ کیف پول از طریق درگاه پرداخت (کد پیگیری: ${verification.refId})`,
      performedBy: String(topup.user),
      idempotencyKey: topupCreditKey(topup._id),
      session,
    });
    return WalletTopup.findOneAndUpdate(
      owned,
      {
        $set: {
          status: "paid",
          refId: verification.refId,
          cardPan: verification.cardPan,
          paidAt: now,
          failureReason: null,
          ...clear,
        },
      },
      { new: true, ...(session ? { session } : {}) },
    )
      .select("_id")
      .lean();
  });

  if (finalized) return { outcome: "success", amount: topup.amount };
  return currentOutcome();
}
