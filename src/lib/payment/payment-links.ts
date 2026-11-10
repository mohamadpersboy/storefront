import { randomBytes } from "node:crypto";
import mongoose from "mongoose";
import { Order } from "@/models/Order";
import { Payment } from "@/models/Payment";
import { PaymentLink } from "@/models/PaymentLink";
import { initiateOrderPayment } from "@/lib/payment/initiate-order-payment";

/** عمر لینک پرداخت. */
export const PAYMENT_LINK_TTL_MS = 72 * 60 * 60 * 1000;

/** ۲۴ بایت تصادفی = ۳۲ نویسه base64url. ورودی با هر شکل دیگر قبل از Query رد می‌شود. */
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{32}$/;

export const isPaymentLinkToken = (value: unknown): value is string =>
  typeof value === "string" && TOKEN_PATTERN.test(value);

export const generatePaymentLinkToken = (): string => randomBytes(24).toString("base64url");

export class PaymentLinkError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

interface OrderRow {
  _id: mongoose.Types.ObjectId;
  orderNumber: number;
  status: string;
  paymentMethod: string;
  prepaymentAmount: number;
}

interface LinkRow {
  _id: mongoose.Types.ObjectId;
  order: mongoose.Types.ObjectId;
  token: string;
  expiresAt: Date;
  createdBy: mongoose.Types.ObjectId;
  revokedAt: Date | null;
}

/** جمع پرداخت‌های «paid» (سهم درگاه + کیف پول) — همان تعریف `initiateOrderPayment`. */
async function paidTotal(orderId: unknown): Promise<number> {
  const rows = await Payment.aggregate<{ _id: null; total: number }>([
    { $match: { order: orderId, status: "paid" } },
    { $group: { _id: null, total: { $sum: { $add: ["$amount", { $ifNull: ["$walletAmount", 0] }] } } } },
  ]);
  return rows[0]?.total ?? 0;
}

function assertPayableOrder(order: OrderRow | null): asserts order is OrderRow {
  if (!order) throw new PaymentLinkError("سفارش یافت نشد", 404);
  if (order.paymentMethod === "cash") {
    throw new PaymentLinkError("این سفارش پرداخت در محل است و بخش آنلاین ندارد", 422);
  }
  if (order.status === "cancelled") {
    throw new PaymentLinkError("این سفارش لغو شده است", 409);
  }
}

/**
 * ساخت (یا بازگرداندن) لینک پرداخت یک سفارش — فقط برای کاربر مجاز Dashboard.
 * لینک معتبر قبلی دوباره استفاده می‌شود تا ادمین با هر کلیک لینک جدید نسازد.
 */
export async function createPaymentLink(params: {
  orderId: string;
  createdBy: string;
  now?: Date;
}): Promise<{ token: string; expiresAt: Date; reused: boolean; remaining: number }> {
  const now = params.now ?? new Date();
  if (!mongoose.isValidObjectId(params.orderId)) throw new PaymentLinkError("سفارش یافت نشد", 404);

  const order = await Order.findById(params.orderId)
    .select("orderNumber status paymentMethod prepaymentAmount")
    .lean<OrderRow | null>();
  assertPayableOrder(order);

  const remaining = Math.max(0, order.prepaymentAmount - (await paidTotal(order._id)));
  if (remaining <= 0) {
    throw new PaymentLinkError("بخش آنلاین این سفارش قبلاً به‌طور کامل پرداخت شده است", 409);
  }

  const existing = await PaymentLink.findOne({
    order: order._id,
    revokedAt: null,
    expiresAt: { $gt: now },
  })
    .sort({ createdAt: -1 })
    .lean<LinkRow | null>();
  if (existing) {
    return { token: existing.token, expiresAt: existing.expiresAt, reused: true, remaining };
  }

  const link = await PaymentLink.create({
    order: order._id,
    token: generatePaymentLinkToken(),
    expiresAt: new Date(now.getTime() + PAYMENT_LINK_TTL_MS),
    createdBy: params.createdBy,
  });
  return { token: link.token, expiresAt: link.expiresAt, reused: false, remaining };
}

export type PaymentLinkState = "payable" | "paid" | "processing" | "unavailable";

export interface PaymentLinkView {
  state: PaymentLinkState;
  orderNumber?: number;
  /** مانده‌ی قابل پرداخت آنلاین (تومان) */
  amount?: number;
  expiresAt?: Date;
}

/**
 * وضعیت صفحه‌ی `/pay/<token>`؛ همیشه از DB (نه Query String). فقط شماره
 * سفارش و مبلغ برمی‌گردد. «paid» حتی بعد از انقضای لینک نمایش داده می‌شود
 * تا مشتری بعد از بازگشت از درگاه نتیجه را ببیند.
 */
export async function getPaymentLinkView(token: string, now = new Date()): Promise<PaymentLinkView> {
  if (!isPaymentLinkToken(token)) return { state: "unavailable" };

  const link = await PaymentLink.findOne({ token }).lean<LinkRow | null>();
  if (!link) return { state: "unavailable" };

  const order = await Order.findById(link.order)
    .select("orderNumber status paymentMethod prepaymentAmount")
    .lean<OrderRow | null>();
  if (!order || order.paymentMethod === "cash") return { state: "unavailable" };

  const remaining = Math.max(0, order.prepaymentAmount - (await paidTotal(order._id)));
  if (remaining <= 0) return { state: "paid", orderNumber: order.orderNumber, amount: order.prepaymentAmount };

  if (order.status === "cancelled" || link.revokedAt || link.expiresAt <= now) {
    return { state: "unavailable" };
  }

  const inFlight = await Payment.exists({ order: order._id, status: "processing" });
  return {
    state: inFlight ? "processing" : "payable",
    orderNumber: order.orderNumber,
    amount: remaining,
    expiresAt: link.expiresAt,
  };
}

/**
 * شروع پرداخت از صفحه‌ی عمومی. همان `initiateOrderPayment` (Claim اتمیک،
 * مبلغ از DB) صدا زده می‌شود؛ مبلغ و سفارش هرگز از Client خوانده نمی‌شود.
 */
export async function startPaymentFromLink(token: string, now = new Date()): Promise<{ paymentUrl: string }> {
  if (!isPaymentLinkToken(token)) throw new PaymentLinkError("لینک پرداخت معتبر نیست", 404);

  const link = await PaymentLink.findOne({ token }).lean<LinkRow | null>();
  if (!link || link.revokedAt || link.expiresAt <= now) {
    throw new PaymentLinkError("لینک پرداخت معتبر نیست یا منقضی شده است", 404);
  }

  const order = await Order.findById(link.order)
    .select("orderNumber status paymentMethod prepaymentAmount")
    .lean<OrderRow | null>();
  assertPayableOrder(order);

  const result = await initiateOrderPayment({
    orderId: String(order._id),
    initiatedByUserId: String(link.createdBy),
    useWallet: false,
    paymentLinkId: String(link._id),
  });
  if (!result.paymentUrl) throw new PaymentLinkError("شروع پرداخت ممکن نشد", 502);
  return { paymentUrl: result.paymentUrl };
}

/**
 * مسیر بازگشت بعد از Callback درگاه: اگر پرداخت از صفحه‌ی لینک شروع شده،
 * `/pay/<token>`؛ وگرنه null. هرگز Throw نمی‌کند (شکست = مسیر عادی نتیجه).
 */
export async function getPaymentLinkReturnPath(authority: string | null): Promise<string | null> {
  if (!authority) return null;
  try {
    const payment = await Payment.findOne({ authority }).select("paymentLink").lean<{
      paymentLink?: mongoose.Types.ObjectId | null;
    } | null>();
    if (!payment?.paymentLink) return null;
    const link = await PaymentLink.findById(payment.paymentLink).select("token").lean<{ token: string } | null>();
    return link && isPaymentLinkToken(link.token) ? `/pay/${link.token}` : null;
  } catch {
    return null;
  }
}
