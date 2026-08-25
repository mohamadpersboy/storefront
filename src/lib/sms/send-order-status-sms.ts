import { env } from "@/config/env";
import type { OrderStatus } from "@/lib/constants/order-status";

const SMS_IR_BULK_URL = "https://api.sms.ir/v1/send/bulk";

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
 * Best-effort order-status notification via sms.ir's Bulk method
 * (freeform text, no pre-approved template required — unlike OTP,
 * which uses the approved Pattern/Verify template because the exact
 * wording there is fixed and time-critical). Callers should treat
 * failures here as non-fatal: a status change should never fail just
 * because the notification SMS couldn't be sent.
 */
export async function sendOrderStatusSms(
  phoneNumber: string,
  orderNumber: number,
  status: OrderStatus,
): Promise<void> {
  const messageText = STATUS_MESSAGES[status](orderNumber);

  const response = await fetch(SMS_IR_BULK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": env.SMS_IR_API_KEY,
    },
    body: JSON.stringify({
      lineNumber: Number(env.SMS_IR_LINE_NUMBER),
      messageText,
      mobiles: [phoneNumber],
      sendDateTime: null,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    throw new Error(`sms.ir bulk request failed (${response.status}): ${errorBody}`);
  }

  const data: { status?: number; message?: string } = await response.json();
  if (data.status !== 1) {
    throw new Error(`sms.ir rejected the request: ${data.message ?? "unknown error"}`);
  }
}
