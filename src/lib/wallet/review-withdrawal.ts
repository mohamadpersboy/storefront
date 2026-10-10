import mongoose from "mongoose";
import { WithdrawalRequest } from "@/models/WithdrawalRequest";
import { adjustWalletBalance } from "@/lib/wallet/wallet-service";
import { runInTransaction } from "@/lib/db/transaction";

export type ReviewWithdrawalResult =
  | { kind: "ok"; id: string; status: "approved_paid" | "rejected"; amount: number }
  | { kind: "not_found" }
  | { kind: "conflict" }
  | { kind: "retry_later" };

export function withdrawalRefundKey(withdrawalId: unknown): string {
  return `withdrawal-refund:${String(withdrawalId)}`;
}

interface WithdrawalRow {
  _id: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  amount: number;
  status: string;
}

/**
 * بررسی درخواست برداشت (Phase 2.1).
 *
 * تأیید: انتقال اتمیک `pending → approved_paid`، فقط اگر رد شروع نشده باشد.
 *
 * رد (امن در برابر تکرار/هم‌زمانی/کرش):
 *  ۱. Claim اتمیک روی `pending` (ثبت `rejectionStartedAt`) — از این لحظه تأیید ممنوع است.
 *  ۲. استرداد با کلید یکتای `withdrawal-refund:<id>` + نهایی‌سازی `rejected`
 *     (شرط `status: "pending"`) در `runInTransaction`.
 *  ترتیب «استرداد، بعد rejected» یعنی `rejected` هرگز بدون استرداد نیست. اگر
 *  برنامه بین دو مرحله قطع شود (وضعیت `pending` با `rejectionStartedAt`)، رد
 *  دوباره همان کلید را می‌گیرد، اثر مالی تکراری نمی‌سازد و فقط نهایی می‌کند.
 *  دو رد هم‌زمان: هر دو کلید یکسان دارند (یک اعتبار)؛ فقط یکی نهایی می‌کند.
 */
export async function reviewWithdrawal(params: {
  id: string;
  action: "approve" | "reject";
  note: string | null;
  actorId: unknown;
  now?: Date;
}): Promise<ReviewWithdrawalResult> {
  const { id, action, note, actorId } = params;
  const now = params.now ?? new Date();

  if (!mongoose.isValidObjectId(id)) return { kind: "not_found" };

  const existing = await WithdrawalRequest.findById(id)
    .select("user amount status")
    .lean<WithdrawalRow | null>();
  if (!existing) return { kind: "not_found" };
  if (existing.status !== "pending") return { kind: "conflict" };

  const reviewFields = { reviewedBy: actorId, reviewNote: note, reviewedAt: now };

  if (action === "approve") {
    const approved = await WithdrawalRequest.findOneAndUpdate(
      { _id: existing._id, status: "pending", rejectionStartedAt: null },
      { $set: { status: "approved_paid", ...reviewFields } },
      { new: true },
    )
      .select("_id")
      .lean();
    if (!approved) return { kind: "conflict" };
    return { kind: "ok", id: String(existing._id), status: "approved_paid", amount: existing.amount };
  }

  const claimed = await WithdrawalRequest.findOneAndUpdate(
    { _id: existing._id, status: "pending" },
    { $set: { rejectionStartedAt: now } },
    { new: true },
  )
    .select("_id")
    .lean();
  if (!claimed) return { kind: "conflict" };

  try {
    const finalized = await runInTransaction(async (session) => {
      await adjustWalletBalance({
        userId: String(existing.user),
        type: "credit",
        amount: existing.amount,
        reason: `استرداد درخواست برداشت رد‌شده${note ? ` — ${note}` : ""}`,
        performedBy: String(actorId),
        idempotencyKey: withdrawalRefundKey(existing._id),
        session,
      });
      return WithdrawalRequest.findOneAndUpdate(
        { _id: existing._id, status: "pending" },
        { $set: { status: "rejected", ...reviewFields } },
        { new: true, ...(session ? { session } : {}) },
      )
        .select("_id")
        .lean();
    });
    if (!finalized) return { kind: "conflict" };
    return { kind: "ok", id: String(existing._id), status: "rejected", amount: existing.amount };
  } catch (error) {
    console.error("[withdrawal/reject] failed:", (error as Error)?.name);
    return { kind: "retry_later" };
  }
}
