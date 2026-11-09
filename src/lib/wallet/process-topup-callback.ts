import { randomUUID } from "node:crypto";
import type { Types } from "mongoose";
import { WalletTopup, type WalletTopupStatus } from "@/models/WalletTopup";
import { getGateway, isOnlineGatewayId, type OnlineGatewayId } from "@/lib/payment/gateways";
import { isDigitalReceiptUsed } from "@/lib/payment/digital-receipt";
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
  /** درگاه کد خطایی داد که معنی رسمی‌اش تأیید نشده؛ رکورد `pending` ماند و برای بررسی دستی علامت خورد. */
  manualReview?: boolean;
}

interface TopupRow {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  amount: number;
  status: WalletTopupStatus;
  provider?: string;
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
  /** درگاهی که Callback از آن آمده. اگر داده شود باید با `provider` رکورد یکی باشد (پیش‌فرض: provider رکورد). */
  gateway?: OnlineGatewayId;
  callbackData?: Record<string, string>;
}): Promise<TopupCallbackResult> {
  const now = params.now ?? new Date();
  const { authority } = params;
  if (!authority || !AUTHORITY_PATTERN.test(authority)) return { outcome: "error" };

  const topup = await WalletTopup.findOne({ authority })
    .select("user amount status provider")
    .lean<TopupRow | null>();
  if (!topup) return { outcome: "error" };

  // Verify همیشه با درگاهی که رکورد با آن ساخته شده؛ نه با پارامتر ورودی.
  const providerId: OnlineGatewayId = isOnlineGatewayId(topup.provider) ? topup.provider : "zarinpal";
  if (params.gateway && params.gateway !== providerId) return { outcome: "error" };
  const gateway = await getGateway(providerId);

  const done = settled(topup.status);
  if (done) return { outcome: done, amount: topup.amount };

  // سپهر بدون داده‌ی Callback (رسید دیجیتال) قابل Verify نیست (مثلاً Cron):
  // بدون Claim و بدون شمارش تلاش، همان `pending` می‌ماند.
  if (providerId !== "zarinpal" && !params.callbackData) return { outcome: "pending", amount: topup.amount };

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
    {
      $set: {
        status: "processing",
        processingToken: token,
        processingStartedAt: now,
        lastReconcileAt: now,
      },
      $inc: { reconcileAttempts: 1 },
    },
    { returnDocument: "after" },
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

  const owned = { _id: topup._id, status: "processing" as const, processingToken: token };
  const clear = { processingToken: null, processingStartedAt: null };

  try {
    const receipt = gateway.extractReceipt?.(params.callbackData) ?? null;
    if (receipt && (await isDigitalReceiptUsed(receipt, { topupId: topup._id }))) {
      await WalletTopup.findOneAndUpdate(owned, {
        $set: {
          status: "pending",
          needsManualReview: true,
          reconciliationNote: "manual_review_required: digital_receipt_already_used",
          ...clear,
        },
      });
      return { outcome: "pending", amount: topup.amount, manualReview: true };
    }

    const verification = await gateway.verifyPayment({
      amount: topup.amount,
      authority,
      callbackData: params.callbackData,
    });

    if (!verification.success) {
      if (verification.retryable) {
        await WalletTopup.findOneAndUpdate(owned, { $set: { status: "pending", ...clear } });
        return { outcome: "pending", amount: topup.amount };
      }
      if (!verification.unconfirmed) {
        // رد قطعی (مثلاً لغو توسط کاربر): فقط رکورد شارژ failed می‌شود؛ پولی کسر نشده.
        await WalletTopup.findOneAndUpdate(owned, {
          $set: { status: "failed", failureReason: verification.message, ...clear },
        });
        return currentOutcome();
      }
      // کدهای تأییدنشده (زرین‌پال -50/-51/-53/-54، سپهر) NOT VERIFIED‌اند؛
      // پس هرگز خودکار `failed` نمی‌شوند. رکورد `pending` می‌ماند، علامت
      // بررسی دستی می‌گیرد و Cron تا سقف سن، دوباره Verify می‌کند.
      await WalletTopup.findOneAndUpdate(owned, {
        $set: {
          status: "pending",
          needsManualReview: true,
          reconciliationNote: `manual_review_required: gateway_reported_failure_unconfirmed (code ${verification.code}: ${verification.message})`,
          ...clear,
        },
      });
      return { outcome: "pending", amount: topup.amount, manualReview: true };
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
            ...(verification.digitalReceipt ? { digitalReceipt: verification.digitalReceipt } : {}),
            paidAt: now,
            failureReason: null,
            reconciliationNote: null,
            needsManualReview: false,
            ...clear,
          },
        },
        { returnDocument: "after", ...(session ? { session } : {}) },
      )
        .select("_id")
        .lean();
    });

    if (finalized) return { outcome: "success", amount: topup.amount };
    return currentOutcome();
  } catch (error) {
    // Exception بعد از Claim: فقط مالک Token می‌تواند Claim را رها کند.
    // اگر وضعیت قبلاً `paid` شده باشد، این به‌روزرسانی چیزی را تغییر نمی‌دهد.
    // اعتبار اگر اعمال شده باشد با کلید یکتا در تلاش بعدی دوباره اعمال نمی‌شود.
    try {
      await WalletTopup.findOneAndUpdate(owned, { $set: { status: "pending", ...clear } });
    } catch {
      // Claim کهنه بعد از TTL قابل تصاحب است.
    }
    throw error;
  }
}
