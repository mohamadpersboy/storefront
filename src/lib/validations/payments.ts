import { z } from "zod";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const initiatePaymentSchema = z.object({
  orderId: z.string().regex(objectIdRegex, "سفارش انتخاب‌شده معتبر نیست"),
  // پرداخت ترکیبی: اگر true باشد، ابتدا تا سقف موجودی کیف پول مشتری
  // از مبلغ باقی‌مانده کسر می‌شود و فقط باقیمانده واقعی به درگاه
  // زرین‌پال فرستاده می‌شود.
  useWallet: z.boolean().optional().default(false),
});
