import { randomUUID } from "node:crypto";
import mongoose from "mongoose";
import { Order } from "@/models/Order";
import { Payment } from "@/models/Payment";
import { WalletTransaction } from "@/models/WalletTransaction";
import { computeRemainingOnlineAmount } from "@/lib/utils/pricing";
import { requestZarinpalPayment, getZarinpalStartPayUrl } from "@/lib/payment/zarinpal";
import { env } from "@/config/env";
import {
  getOrCreateWallet,
  adjustWalletBalance,
  isWalletOperationApplied,
  WalletAdjustmentError,
} from "@/lib/wallet/wallet-service";
import { paymentWalletDebitKey, paymentRefundKey } from "@/lib/payment/payment-keys";

/**
 * عمر Claim «شروع پرداخت» روی سفارش. فقط Heuristic است؛ امنیت مالی به آن
 * وابسته نیست: کسر و استرداد کیف پول با کلید یکتای هر Payment انجام می‌شود.
 */
export const PAYMENT_INITIATION_CLAIM_TTL_MS = 2 * 60 * 1000;

export class PaymentInitiationError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export interface InitiateOrderPaymentParams {
  orderId: string;
  /** کاربری که این درخواست پرداخت را شروع می‌کند — ادمین یا خود مشتری */
  initiatedByUserId: string;
  /** پرداخت ترکیبی: تا سقف موجودی واقعی کیف پول مشتری کسر می‌شود */
  useWallet?: boolean;
}

/**
 * منطق واقعی شروع پرداخت — از `POST /api/v1/payments/initiate`
 * استخراج شد تا `POST /api/v1/checkout` هم بتواند بلافاصله بعد از
 * ایجاد سفارش همین تابع را صدا بزند. پرداخت ترکیبی (Wallet + درگاه) و
 * استرداد خودکار سهم کیف پول در صورت شکست درگاه همین‌جا پیاده‌سازی شده‌اند.
 *
 * امنیت مالی (Phase «Idempotency پرداخت سفارش»):
 *  - فقط یک شروع پرداخت هم‌زمان برای هر سفارش: Claim اتمیک روی `Order`
 *    (`paymentInitiationToken`). درخواست هم‌زمان دیگر ۴۰۹ می‌گیرد، پس نه
 *    دو بار کیف پول کسر می‌شود و نه دو Authority ساخته می‌شود.
 *  - شناسه Payment قبل از هر کار مالی ساخته و روی Claim ثبت می‌شود؛ کسر کیف پول
 *    با کلید `payment-wallet-debit:<paymentId>` و استرداد با `payment-refund:<paymentId>`
 *    (همان کلید Callback درگاه) انجام می‌شود؛ پس تکرار/Retry اثر مالی دوباره ندارد.
 *  - کرش بعد از کسر و قبل از ساخت Payment: Claim کهنه که تصاحب می‌شود، کسر
 *    یتیم را (اگر اعمال شده و Payment ندارد) با همان کلید استرداد می‌کند.
 *  - «پرداخت‌شده تاکنون» شامل `walletAmount` هم هست (قبلاً فقط `amount`).
 */
export async function initiateOrderPayment(params: InitiateOrderPaymentParams) {
  const { orderId, initiatedByUserId, useWallet = false } = params;

  if (!mongoose.isValidObjectId(orderId)) {
    throw new PaymentInitiationError("سفارش یافت نشد", 404);
  }
  const order = await Order.findById(orderId).populate("customer", "phoneNumber");
  if (!order) {
    throw new PaymentInitiationError("سفارش یافت نشد", 404);
  }
  if (order.paymentMethod === "cash") {
    throw new PaymentInitiationError("این سفارش پرداخت در محل است و بخش آنلاین ندارد", 422);
  }

  const customer = order.customer as unknown as { _id?: unknown; phoneNumber?: string } | undefined;
  const customerId = customer?._id ? String(customer._id) : null;

  // ── Claim اتمیک شروع پرداخت ────────────────────────────────────────────
  const token = randomUUID();
  const paymentId = new mongoose.Types.ObjectId();
  const now = new Date();
  const staleBefore = new Date(now.getTime() - PAYMENT_INITIATION_CLAIM_TTL_MS);
  const previous = await Order.findOneAndUpdate(
    {
      _id: order._id,
      $or: [
        { paymentInitiationToken: null },
        { paymentInitiationToken: { $exists: false } },
        { paymentInitiationStartedAt: { $lt: staleBefore } },
      ],
    },
    {
      $set: {
        paymentInitiationToken: token,
        paymentInitiationStartedAt: now,
        paymentInitiationPaymentId: paymentId,
      },
    },
    { returnDocument: "before" },
  )
    .select("paymentInitiationToken paymentInitiationPaymentId")
    .lean<{ paymentInitiationToken?: string | null; paymentInitiationPaymentId?: unknown } | null>();

  if (!previous) {
    throw new PaymentInitiationError("شروع پرداخت این سفارش در حال انجام است؛ چند لحظه بعد دوباره تلاش کنید", 409);
  }

  const release = async () => {
    await Order.updateOne(
      { _id: order._id, paymentInitiationToken: token },
      { $set: { paymentInitiationToken: null, paymentInitiationStartedAt: null } },
    ).catch(() => undefined);
  };

  try {
    // بازیابی: Claim کهنه‌ی قبلی ممکن است بعد از کسر کیف پول و قبل از ساخت Payment قطع شده باشد.
    if (previous.paymentInitiationToken && previous.paymentInitiationPaymentId && customerId) {
      const orphanId = previous.paymentInitiationPaymentId;
      const orphanPayment = await Payment.exists({ _id: orphanId });
      if (!orphanPayment && (await isWalletOperationApplied(customerId, paymentWalletDebitKey(orphanId)))) {
        const debitRow = await WalletTransaction.findOne({ idempotencyKey: paymentWalletDebitKey(orphanId) })
          .select("amount")
          .lean<{ amount: number } | null>();
        if (debitRow) {
          await adjustWalletBalance({
            userId: customerId,
            type: "credit",
            amount: debitRow.amount,
            reason: `استرداد کسر یتیم کیف پول — شروع پرداخت سفارش #${order.orderNumber} ناتمام ماند`,
            performedBy: initiatedByUserId,
            idempotencyKey: paymentRefundKey(orphanId),
          });
        }
      }
    }

    // پس از Claim دوباره می‌خوانیم: وضعیت قبل از Claim معتبر نیست.
    const paidSoFar = await Payment.aggregate<{ _id: null; total: number }>([
      { $match: { order: order._id, status: "paid" } },
      { $group: { _id: null, total: { $sum: { $add: ["$amount", { $ifNull: ["$walletAmount", 0] }] } } } },
    ]);
    const alreadyPaid = paidSoFar[0]?.total ?? 0;
    const remaining = computeRemainingOnlineAmount(order.prepaymentAmount, alreadyPaid);

    if (remaining <= 0) {
      throw new PaymentInitiationError("بخش آنلاین این سفارش قبلاً به‌طور کامل پرداخت شده است", 409);
    }

    // Reuse an already-open (not yet resolved) payment session instead of
    // stacking duplicate Zarinpal authorities for the same order. چون Claim
    // داریم، دو شروع هم‌زمان نمی‌توانند هر دو «بازِ موجود نیست» ببینند.
    const openPayment = await Payment.findOne({
      order: order._id,
      status: { $in: ["pending", "processing"] },
    }).sort({ createdAt: -1 });
    if (openPayment) {
      return {
        paymentId: openPayment.id,
        paymentUrl: getZarinpalStartPayUrl(openPayment.authority),
        amount: openPayment.amount,
        walletAmount: openPayment.walletAmount,
        paidFromWallet: false,
        reused: true,
      };
    }

    // پرداخت ترکیبی — تا سقف موجودی واقعی کیف پول مشتری، نه بیشتر؛ اگر
    // کل مبلغ باقی‌مانده را کیف پول پوشش دهد، اصلاً نیازی به زرین‌پال نیست.
    let remainingAfterWallet = remaining;
    let walletPortion = 0;

    if (useWallet && customerId) {
      const wallet = await getOrCreateWallet(customerId);
      walletPortion = Math.min(wallet.balance, remaining);

      if (walletPortion > 0) {
        try {
          await adjustWalletBalance({
            userId: customerId,
            type: "debit",
            amount: walletPortion,
            reason: `پرداخت بخشی از سفارش #${order.orderNumber} از کیف پول`,
            performedBy: initiatedByUserId,
            idempotencyKey: paymentWalletDebitKey(paymentId),
          });
        } catch (error) {
          if (error instanceof WalletAdjustmentError) {
            throw new PaymentInitiationError("موجودی کیف پول هم‌زمان تغییر کرد؛ دوباره تلاش کنید", 409);
          }
          throw error;
        }
        remainingAfterWallet = remaining - walletPortion;
      }
    }

    const refundWalletPortion = async (why: string) => {
      if (walletPortion > 0 && customerId) {
        await adjustWalletBalance({
          userId: customerId,
          type: "credit",
          amount: walletPortion,
          reason: `استرداد بخش کیف پول — ${why} سفارش #${order.orderNumber}`,
          performedBy: initiatedByUserId,
          idempotencyKey: paymentRefundKey(paymentId),
        });
      }
    };

    if (remainingAfterWallet <= 0) {
      // کل مبلغ از کیف پول پوشش داده شد — نیازی به درگاه نیست.
      let payment;
      try {
        payment = await Payment.create({
          _id: paymentId,
          order: order._id,
          amount: 0,
          walletAmount: walletPortion,
          provider: "zarinpal",
          status: "paid",
          authority: `wallet-${paymentId}`, // یکتا، هرگز واقعاً به زرین‌پال ارسال نمی‌شود
          description: `پرداخت کامل سفارش #${order.orderNumber} از کیف پول`,
          initiatedBy: initiatedByUserId,
          paidAt: new Date(),
        });
      } catch (error) {
        await refundWalletPortion("ثبت پرداخت ناموفق بود،").catch(() => undefined);
        throw error;
      }

      return {
        paymentId: payment.id,
        paymentUrl: null,
        amount: 0,
        walletAmount: walletPortion,
        paidFromWallet: true,
        reused: false,
      };
    }

    const description = `پرداخت سفارش #${order.orderNumber} — فروشگاه فرش`;
    const callbackUrl = new URL("/api/v1/payments/callback", env.NEXT_PUBLIC_APP_URL).toString();

    let result;
    try {
      result = await requestZarinpalPayment({
        amount: remainingAfterWallet,
        description,
        callbackUrl,
        mobile: customer?.phoneNumber,
      });
    } catch (error) {
      await refundWalletPortion("خطای درخواست پرداخت،").catch(() => undefined);
      throw error;
    }

    if (!("authority" in result)) {
      // درگاه رد کرد — سهم کیف پول با کلید یکتا برمی‌گردد (تکرار اثر ندارد).
      await refundWalletPortion("درخواست پرداخت توسط درگاه رد شد،");
      throw new PaymentInitiationError(result.message, 502);
    }

    const { authority, paymentUrl } = result;

    let payment;
    try {
      payment = await Payment.create({
        _id: paymentId,
        order: order._id,
        amount: remainingAfterWallet,
        walletAmount: walletPortion,
        provider: "zarinpal",
        status: "pending",
        authority,
        description,
        initiatedBy: initiatedByUserId,
      });
    } catch (error) {
      // Authority ساخته شده ولی Payment ثبت نشد؛ پول کیف پول نباید گیر کند.
      await refundWalletPortion("ثبت پرداخت ناموفق بود،").catch(() => undefined);
      throw error;
    }

    return {
      paymentId: payment.id,
      paymentUrl,
      amount: remainingAfterWallet,
      walletAmount: walletPortion,
      paidFromWallet: false,
      reused: false,
    };
  } finally {
    await release();
  }
}
