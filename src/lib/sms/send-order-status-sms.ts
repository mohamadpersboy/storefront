import type { OrderStatus } from "@/lib/constants/order-status";
import { sendBulkSms } from "@/lib/sms/send-bulk-sms";

const STATUS_MESSAGES: Record<OrderStatus, (orderNumber: number) => string> = {
  pending: (n) => `سفارش شما به شماره ${n} در فرش سقطچی ثبت شد و در انتظار بررسی است.`,
  confirmed: (n) => `سفارش شماره ${n} شما تأیید شد.`,
  processing: (n) => `سفارش شماره ${n} شما در حال آماده‌سازی است.`,
  ready_to_ship: (n) => `سفارش شماره ${n} شما آماده ارسال است.`,
  shipped: (n) => `سفارش شماره ${n} شما ارسال شد.`,
  delivered: (n) => `سفارش شماره ${n} شما با موفقیت تحویل داده شد. از خرید شما متشکریم.`,
  cancelled: (n) => `سفارش شماره ${n} شما لغو شد.`,
  returned: (n) => `مرجوعی سفارش شماره ${n} شما ثبت شد.`,
};

/**
 * Sends the SMS for an order's *current* status. Best-effort: callers
 * should treat failures here as non-fatal in automatic contexts.
 *
 * NOTE: per the employer's explicit decision, this is no longer
 * called automatically anywhere (not on order creation, not on a
 * status transition) — the only caller left in the codebase is the
 * manual `POST /api/v1/orders/:id/notify-status` endpoint, wired to
 * the "ارسال وضعیت به مشتری" button on the order detail page.
 */
export async function sendOrderStatusSms(
  phoneNumber: string,
  orderNumber: number,
  status: OrderStatus,
): Promise<void> {
  await sendBulkSms(phoneNumber, STATUS_MESSAGES[status](orderNumber));
}
