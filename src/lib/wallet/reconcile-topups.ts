import type { Types } from "mongoose";
import { WalletTopup } from "@/models/WalletTopup";
import { processTopupCallback, TOPUP_CLAIM_TTL_MS } from "@/lib/wallet/process-topup-callback";

/** حداقل سن رکورد قبل از Cron: به کاربر فرصت می‌دهد خودش به Callback برگردد. */
export const RECONCILE_MIN_AGE_MS = 10 * 60 * 1000;
/** بعد از این سن، Cron دیگر Verify نمی‌کند؛ رکورد برای بررسی دستی علامت می‌خورد. */
export const RECONCILE_MAX_AGE_MS = 48 * 60 * 60 * 1000;
/** فاصله حداقلی بین دو بررسی خودکار یک رکورد `pending` (چرخش صف). */
export const RECONCILE_RETRY_INTERVAL_MS = 30 * 60 * 1000;
export const RECONCILE_BATCH_LIMIT = 20;
/**
 * بودجه شروع Verifyهای یک اجرا. بدترین حالت: ‌آخرین Verify درست قبل از این
 * سقف شروع شود و تا `VERIFY_TIMEOUT_MS` (۸ ثانیه) طول بکشد؛ مجموع با کارهای DB
 * زیر `maxDuration = 60` Route می‌ماند.
 */
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
 *   `topup-credit:<id>`) پردازش می‌شود.
 * - صف چرخشی است: مرتب‌سازی بر اساس `lastReconcileAt` (هرگز بررسی‌نشده اول)
 *   و رکوردی که کمتر از `RECONCILE_RETRY_INTERVAL_MS` پیش بررسی شده، کنار
 *   می‌ماند؛ پس رکوردهای همیشه‌موقت جلوی بقیه را نمی‌گیرند.
 * - رکورد علامت‌خورده با کد خطای تأییدنشده در صف می‌ماند (تا سقف سن)؛ علامت
 *   فقط `needsManualReview` است، نه خروج از صف.
 * - رکورد قدیمی‌تر از سقف سن بدون Verify فقط `needsManualReview` می‌گیرد و
 *   `failed` نمی‌شود.
 * - Cron هرگز خودکار `failed` نمی‌کند. یک رکورد خراب بقیه را متوقف نمی‌کند.
 */
export async function reconcileTopups(params: {
  now?: Date;
  limit?: number;
  minAgeMs?: number;
  maxAgeMs?: number;
  retryIntervalMs?: number;
  timeBudgetMs?: number;
} = {}): Promise<ReconcileSummary> {
  const now = params.now ?? new Date();
  const limit = Math.max(1, Math.min(params.limit ?? RECONCILE_BATCH_LIMIT, 100));
  const minAgeBefore = new Date(now.getTime() - (params.minAgeMs ?? RECONCILE_MIN_AGE_MS));
  const maxAgeBefore = new Date(now.getTime() - (params.maxAgeMs ?? RECONCILE_MAX_AGE_MS));
  const retryBefore = new Date(now.getTime() - (params.retryIntervalMs ?? RECONCILE_RETRY_INTERVAL_MS));
  const staleBefore = new Date(now.getTime() - TOPUP_CLAIM_TTL_MS);
  const deadline = Date.now() + (params.timeBudgetMs ?? RECONCILE_TIME_BUDGET_MS);

  const summary: ReconcileSummary = {
    scanned: 0, processed: 0, credited: 0, stillPending: 0,
    failed: 0, flaggedForReview: 0, errors: 0, stoppedByBudget: false,
  };

  // ۱) رکوردهای خیلی قدیمی: بدون Verify فقط علامت بررسی دستی (یک عملیات، بدون مصرف سهمیه صف).
  try {
    const flagged = await WalletTopup.updateMany(
      {
        createdAt: { $lt: maxAgeBefore },
        needsManualReview: { $ne: true },
        $or: [
          { status: "pending" },
          { status: "processing", processingStartedAt: { $lt: staleBefore } },
        ],
      },
      { $set: { needsManualReview: true, reconciliationNote: MANUAL_REVIEW_NOTE_TOO_OLD } },
    );
    summary.flaggedForReview += flagged?.modifiedCount ?? 0;
  } catch (error) {
    summary.errors += 1;
    console.error("topup reconcile flag error", error instanceof Error ? error.message : error);
  }

  // ۲) صف چرخشی رکوردهای قابل Verify (سن بین حداقل و حداکثر).
  const candidates = await WalletTopup.find({
    createdAt: { $lt: minAgeBefore, $gte: maxAgeBefore },
    $or: [
      {
        status: "pending",
        $or: [{ lastReconcileAt: null }, { lastReconcileAt: { $lt: retryBefore } }],
      },
      { status: "processing", processingStartedAt: { $lt: staleBefore } },
    ],
  })
    .sort({ lastReconcileAt: 1, createdAt: 1 })
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
      const r = await processTopupCallback({ authority: c.authority, now });
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
