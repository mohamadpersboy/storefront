import { Order } from "@/models/Order";
import { Payment } from "@/models/Payment";
import { computeRemainingOnlineAmount } from "@/lib/utils/pricing";
import { requestZarinpalPayment, getZarinpalStartPayUrl } from "@/lib/payment/zarinpal";
import { env } from "@/config/env";
import { getOrCreateWallet, adjustWalletBalance } from "@/lib/wallet/wallet-service";

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
 * ایجاد سفارش، بدون یک Round-trip داخلی HTTP اضافه، همین تابع را صدا
 * بزند. پرداخت ترکیبی (Wallet + درگاه) و استرداد خودکار سهم کیف پول
 * در صورت شکست درگاه، همین‌جا (نه در Route) پیاده‌سازی شده‌اند.
 */
export async function initiateOrderPayment(params: InitiateOrderPaymentParams) {
  const { orderId, initiatedByUserId, useWallet = false } = params;

  const order = await Order.findById(orderId).populate("customer", "phoneNumber");
  if (!order) {
    throw new PaymentInitiationError("سفارش یافت نشد", 404);
  }
  if (order.paymentMethod === "cash") {
    throw new PaymentInitiationError("این سفارش پرداخت در محل است و بخش آنلاین ندارد", 422);
  }

  const paidSoFar = await Payment.aggregate<{ _id: null; total: number }>([
    { $match: { order: order._id, status: "paid" } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);
  const alreadyPaid = paidSoFar[0]?.total ?? 0;
  const remaining = computeRemainingOnlineAmount(order.prepaymentAmount, alreadyPaid);

  if (remaining <= 0) {
    throw new PaymentInitiationError("بخش آنلاین این سفارش قبلاً به‌طور کامل پرداخت شده است", 409);
  }

  // Reuse an already-open (not yet resolved) payment session instead of
  // stacking duplicate Zarinpal authorities for the same order.
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

  const customer = order.customer as unknown as { _id?: unknown; phoneNumber?: string } | undefined;

  // پرداخت ترکیبی — تا سقف موجودی واقعی کیف پول مشتری، نه بیشتر؛ اگر
  // کل مبلغ باقی‌مانده را کیف پول پوشش دهد، اصلاً نیازی به زرین‌پال نیست.
  let remainingAfterWallet = remaining;
  let walletPortion = 0;

  if (useWallet && customer?._id) {
    const wallet = await getOrCreateWallet(String(customer._id));
    walletPortion = Math.min(wallet.balance, remaining);

    if (walletPortion > 0) {
      await adjustWalletBalance({
        userId: String(customer._id),
        type: "debit",
        amount: walletPortion,
        reason: `پرداخت بخشی از سفارش #${order.orderNumber} از کیف پول`,
        performedBy: initiatedByUserId,
      });
      remainingAfterWallet = remaining - walletPortion;
    }
  }

  if (remainingAfterWallet <= 0) {
    // کل مبلغ از کیف پول پوشش داده شد — نیازی به درگاه نیست.
    const payment = await Payment.create({
      order: order._id,
      amount: 0,
      walletAmount: walletPortion,
      provider: "zarinpal",
      status: "paid",
      authority: `wallet-${order._id}-${Date.now()}`, // یکتا، هرگز واقعاً به زرین‌پال ارسال نمی‌شود
      description: `پرداخت کامل سفارش #${order.orderNumber} از کیف پول`,
      initiatedBy: initiatedByUserId,
      paidAt: new Date(),
    });

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

  const result = await requestZarinpalPayment({
    amount: remainingAfterWallet,
    description,
    callbackUrl,
    mobile: customer?.phoneNumber,
  });

  if (!("authority" in result)) {
    // درگاه رد کرد — اگر بخشی از کیف پول کسر شده بود، باید برگردانیم
    // تا مشتری بابت یک تلاش ناموفق پول از دست ندهد.
    if (walletPortion > 0 && customer?._id) {
      await adjustWalletBalance({
        userId: String(customer._id),
        type: "credit",
        amount: walletPortion,
        reason: `استرداد بخش کیف پول — درخواست پرداخت سفارش #${order.orderNumber} توسط درگاه رد شد`,
        performedBy: initiatedByUserId,
      });
    }
    throw new PaymentInitiationError(result.message, 502);
  }

  const { authority, paymentUrl } = result;

  const payment = await Payment.create({
    order: order._id,
    amount: remainingAfterWallet,
    walletAmount: walletPortion,
    provider: "zarinpal",
    status: "pending",
    authority,
    description,
    initiatedBy: initiatedByUserId,
  });

  return {
    paymentId: payment.id,
    paymentUrl,
    amount: remainingAfterWallet,
    walletAmount: walletPortion,
    paidFromWallet: false,
    reused: false,
  };
}
