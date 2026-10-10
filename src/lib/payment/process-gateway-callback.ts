import { randomUUID } from "node:crypto";
import type { Types } from "mongoose";
import { Payment, type PaymentStatus } from "@/models/Payment";
import { Order } from "@/models/Order";
import { verifyZarinpalPayment } from "@/lib/payment/zarinpal";
import { adjustWalletBalance } from "@/lib/wallet/wallet-service";
import { runInTransaction } from "@/lib/db/transaction";
import { notifyPaymentResult } from "@/lib/notifications/events";

/** عمر یک Claim پردازش؛ بعد از آن Claim «کهنه» است و قابل تصاحب. */
export const PROCESSING_CLAIM_TTL_MS = 2 * 60 * 1000;

/** شکل Authority زرین‌پال — ورودی غیرمعتبر قبل از هر Query رد می‌شود. */
const AUTHORITY_PATTERN = /^[A-Za-z0-9]{10,64}$/;

export type GatewayCallbackOutcome = "success" | "failed" | "pending" | "error";

export interface GatewayCallbackResult {
  outcome: GatewayCallbackOutcome;
  orderNumber?: number;
  amount?: number;
}

interface PaymentRow {
  _id: Types.ObjectId;
  order: Types.ObjectId;
  amount: number;
  walletAmount?: number;
  status: PaymentStatus;
  processingStartedAt?: Date | null;
}

interface OrderRow {
  _id: Types.ObjectId;
  orderNumber: number;
  customer: unknown;
  prepaymentAmount: number;
}

function toResult(
  outcome: GatewayCallbackOutcome,
  payment: PaymentRow | null,
  order: OrderRow | null,
): GatewayCallbackResult {
  return {
    outcome,
    ...(order ? { orderNumber: order.orderNumber } : {}),
    ...(payment ? { amount: payment.amount } : {}),
  };
}

/** نتیجه‌ی قطعی یک Payment که قبلاً پردازش شده، بدون تماس با درگاه. */
function resolveSettled(status: PaymentStatus): GatewayCallbackOutcome | null {
  if (status === "paid") return "success";
  if (status === "pending" || status === "processing") return null;
  return "failed";
}

async function notifySafely(
  payment: PaymentRow,
  order: OrderRow | null,
  success: boolean,
): Promise<void> {
  if (!order?.customer) return;
  try {
    await notifyPaymentResult({
      paymentId: String(payment._id),
      orderId: String(order._id),
      orderNumber: order.orderNumber,
      customerId: String(order.customer),
      success,
    });
  } catch {
    // اعلان اطلاعاتی است؛ شکستش نباید نتیجه مالی را تغییر دهد.
  }
}

/**
 * جمع پرداخت‌های «paid» دیگرِ همین سفارش (سهم درگاه + کیف پول).
 * فقط برای تشخیص پرداخت اضافی (Reconciliation)؛ رفتار را تغییر نمی‌دهد.
 */
async function isOrderAlreadyCovered(payment: PaymentRow, order: OrderRow | null): Promise<boolean> {
  if (!order) return false;
  const others = await Payment.find({
    order: payment.order,
    status: "paid",
    _id: { $ne: payment._id },
  })
    .select("amount walletAmount")
    .lean<{ amount: number; walletAmount?: number }[]>();
  const paid = others.reduce((s, p) => s + p.amount + (p.walletAmount ?? 0), 0);
  return paid >= order.prepaymentAmount;
}

/**
 * پردازش امن و Idempotent بازگشت مشتری از درگاه (Security Phase 1).
 *
 * اصل‌ها:
 *  - ورودی Query (Status/amount) هرگز قابل اعتماد نیست؛ همیشه با درگاه
 *    و با مبلغ ذخیره‌شده Verify می‌شود.
 *  - فقط یک درخواست می‌تواند Payment را `pending → processing` ببرد
 *    (یک `findOneAndUpdate` شرطی) و فقط همان مالک (`processingToken`)
 *    می‌تواند آن را نهایی کند.
 *  - خطای موقت درگاه/شبکه Payment را failed نمی‌کند؛ pending می‌ماند.
 *  - استرداد سهم کیف پول با کلید یکتا انجام می‌شود (حداکثر یک‌بار).
 */
export async function processGatewayCallback(params: {
  authority: string | null;
  now?: Date;
}): Promise<GatewayCallbackResult> {
  const { authority } = params;
  const now = params.now ?? new Date();

  if (!authority || !AUTHORITY_PATTERN.test(authority)) return { outcome: "error" };

  const payment = await Payment.findOne({ authority, provider: "zarinpal" })
    .select("order amount walletAmount status processingStartedAt")
    .lean<PaymentRow | null>();
  if (!payment) return { outcome: "error" };

  const order = await Order.findById(payment.order)
    .select("orderNumber customer prepaymentAmount")
    .lean<OrderRow | null>();

  const settled = resolveSettled(payment.status);
  if (settled) return toResult(settled, payment, order);

  // ── Claim اتمیک ──
  const token = randomUUID();
  const staleBefore = new Date(now.getTime() - PROCESSING_CLAIM_TTL_MS);
  const claimed = await Payment.findOneAndUpdate(
    {
      _id: payment._id,
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

  if (!claimed) {
    // درخواست دیگری Claim را دارد یا Payment همین الان نهایی شد.
    const current = await Payment.findById(payment._id)
      .select("status")
      .lean<{ status: PaymentStatus } | null>();
    const done = current ? resolveSettled(current.status) : "error";
    return toResult(done ?? "pending", payment, order);
  }

  // ── Verify با درگاه؛ مبلغ همیشه از رکورد ذخیره‌شده ──
  const verification = await verifyZarinpalPayment({
    amount: payment.amount,
    authority,
  });

  const owned = {
    _id: payment._id,
    status: "processing" as const,
    processingToken: token,
  };
  const clear = { processingToken: null, processingStartedAt: null };

  if (verification.success) {
    const covered = await isOrderAlreadyCovered(payment, order);
    const finalized = await Payment.findOneAndUpdate(
      owned,
      {
        $set: {
          status: "paid",
          refId: verification.refId,
          cardPan: verification.cardPan,
          paidAt: now,
          failureReason: null,
          ...clear,
          ...(covered
            ? { reconciliationNote: "duplicate_payment_order_already_covered" }
            : {}),
        },
      },
      { new: true },
    )
      .select("_id")
      .lean();

    if (finalized) {
      await notifySafely(payment, order, true);
      return toResult("success", payment, order);
    }
    // Claim از دست رفته: نتیجه را از وضعیت فعلی بخوان.
    const current = await Payment.findById(payment._id)
      .select("status")
      .lean<{ status: PaymentStatus } | null>();
    const done = current ? resolveSettled(current.status) : null;
    return toResult(done ?? "pending", payment, order);
  }

  if (verification.retryable) {
    // نتیجه قطعی نیست؛ Claim را آزاد کن تا تلاش بعدی دوباره Verify کند.
    await Payment.findOneAndUpdate(owned, { $set: { status: "pending", ...clear } });
    return toResult("pending", payment, order);
  }

  // ── رد قطعی درگاه: استرداد (Idempotent) + نهایی‌سازی ──
  const customerId = order?.customer ? String(order.customer) : null;
  const walletAmount = payment.walletAmount ?? 0;
  const finalized = await runInTransaction(async (session) => {
    if (walletAmount > 0 && customerId) {
      await adjustWalletBalance({
        userId: customerId,
        type: "credit",
        amount: walletAmount,
        reason: `استرداد بخش کیف پول — پرداخت سفارش #${order?.orderNumber} توسط درگاه تأیید نشد`,
        performedBy: customerId,
        idempotencyKey: `payment-refund:${String(payment._id)}`,
        session,
      });
    }
    return Payment.findOneAndUpdate(
      owned,
      { $set: { status: "failed", failureReason: verification.message, ...clear } },
      { new: true, ...(session ? { session } : {}) },
    )
      .select("_id")
      .lean();
  });

  if (finalized) await notifySafely(payment, order, false);
  const current = finalized
    ? { status: "failed" as PaymentStatus }
    : await Payment.findById(payment._id).select("status").lean<{ status: PaymentStatus } | null>();
  const done = current ? resolveSettled(current.status) : null;
  return toResult(done ?? "pending", payment, order);
}
