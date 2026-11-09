import { Payment } from "@/models/Payment";
import { WalletTopup } from "@/models/WalletTopup";

/**
 * رسید دیجیتال سپهر به‌ازای هر تراکنش یکتاست. مشتری می‌تواند رسید یک خرید را
 * برای خرید دیگر دوباره بفرستد (Replay)؛ پیش از Advice بررسی می‌کنیم که همان
 * رسید روی پرداخت یا شارژ دیگری ثبت نشده باشد. Index یکتای جزئی روی هر دو
 * مدل، لایه‌ی دوم دفاع است.
 */
export async function isDigitalReceiptUsed(
  receipt: string,
  exclude: { paymentId?: unknown; topupId?: unknown },
): Promise<boolean> {
  const [payment, topup] = await Promise.all([
    Payment.exists({
      digitalReceipt: receipt,
      ...(exclude.paymentId ? { _id: { $ne: exclude.paymentId } } : {}),
    }),
    WalletTopup.exists({
      digitalReceipt: receipt,
      ...(exclude.topupId ? { _id: { $ne: exclude.topupId } } : {}),
    }),
  ]);
  return Boolean(payment || topup);
}
