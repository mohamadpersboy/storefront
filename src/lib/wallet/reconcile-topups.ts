import type { Types } from "mongoose";
import { WalletTopup } from "@/models/WalletTopup";
import { processTopupCallback, TOPUP_CLAIM_TTL_MS } from "@/lib/wallet/process-topup-callback";

/** حداقل سن رکورد قبل از Cron: به کاربر فرصت می‌دهد خودش به Callback برگردد. */
export const RECONCILE_MIN_AGE_MS = 10 * 60 * 1000;
/** بعد از این سن، رکورد پردازش نمی‌شود؛ فقط برای بررسی دستی علامت می‌خورد. */
export const RECONCILE_MAX_AGE_MS = 48 * 60 * 60 * 1000;
export const RECONCILE_BATCH_LIMIT = 20;
/** بودجه زمان یک اجرا (هر Verify یک تماس شبکه است). */
export const RECONCILE_TIME_BUDGET_MS = 40 * 1000;

export const MANUAL_REVIEW_NOTE_TOO_OLD =
  "manual_review_required: unverified_after_max_age";

export interface ReconcileSummary {
  scanned: number;
  processed: number;
  credited: number;
  stillPending: number;
  failed: number;
  flaggedForReview: number;
  errors: number;
  stoppedByBudget: boolean;
}

interface Candidate {
  _id: Types.ObjectId;
  authority: string;
  createdAt: Date;
}

/**
 * آشتی‌سازی TopUpهای نیمه‌کاره. هیچ منطق مالی جدیدی ندارد:
 * - رکورد قابل پردازش با همان `processTopupCallback` (Claim اتمیک + کلید
 *   `topup-credit:<id>`) در حالت `reconcile` پردازش می‌شود.
 * - رکورد خیلی قدیمی بدون Verify فقط علامت بررسی دستی می‌خورد.
 * - Cron هرگز خودکار `failed` نمی‌کند (معنی کدهای خطا NOT VERIFIED است).
 * یک رکورد خراب بقیه را متوقف نمی‌کند.
 */
export async function reconcileTopups(params: {
  now?: Date;
  limit?: number;
  minAgeMs?: number;
  maxAgeMs?: number;
  timeBudgetMs?: number;
} = {}): Promise<ReconcileSummary> {
  const now = params.now ?? new Date();
  const limit = Math.max(1, Math.min(params.limit ?? RECONCILE_BATCH_LIMIT, 100));
  const minAgeBefore = new Date(now.getTime() - (params.minAgeMs ?? RECONCILE_MIN_AGE_MS));
  const maxAgeBefore = new Date(now.getTime() - (params.maxAgeMs ?? RECONCILE_MAX_AGE_MS));
  const staleBefore = new Date(now.getTime() - TOPUP_CLAIM_TTL_MS);
  const deadline = Date.now() + (params.timeBudgetMs ?? RECONCILE_TIME_BUDGET_MS);

  const summary: ReconcileSummary = {
    scanned: 0, processed: 0, credited: 0, stillPending: 0,
    failed: 0, flaggedForReview: 0, errors: 0, stoppedByBudget: false,
  };

  const candidates = await WalletTopup.find({
    reconciliationNote: null,
    createdAt: { $lt: minAgeBefore },
    $or: [
      { status: "pending" },
      { status: "processing", processingStartedAt: { $lt: staleBefore } },
    ],
  })
    .sort({ createdAt: 1 })
    .limit(limit)
    .select("_id authority createdAt")
    .lean<Candidate[]>();

  for (const c of candidates) {
    if (Date.now() > deadline) {
      summary.stoppedByBudget = true;
      break;
    }
    summary.scanned += 1;
    try {
      if (c.createdAt < maxAgeBefore) {
        const flagged = await WalletTopup.findOneAndUpdate(
          {
            _id: c._id,
            reconciliationNote: null,
            $or: [
              { status: "pending" },
              { status: "processing", processingStartedAt: { $lt: staleBefore } },
            ],
          },
          { $set: { reconciliationNote: MANUAL_REVIEW_NOTE_TOO_OLD } },
        )
          .select("_id")
          .lean();
        if (flagged) summary.flaggedForReview += 1;
        continue;
      }
      const r = await processTopupCallback({ authority: c.authority, now, mode: "reconcile" });
      summary.processed += 1;
      if (r.outcome === "success") summary.credited += 1;
      else if (r.outcome === "failed") summary.failed += 1;
      else if (r.manualReview) summary.flaggedForReview += 1;
      else summary.stillPending += 1;
    } catch (error) {
      summary.errors += 1;
      console.error("topup reconcile error", String(c._id), error instanceof Error ? error.message : error);
    }
  }
  return summary;
}
