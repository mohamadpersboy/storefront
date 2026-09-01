import { z } from "zod";
import { shippingAddressSchema } from "@/lib/validations/orders";

export const checkoutSchema = z.object({
  shippingAddress: shippingAddressSchema,
  paymentMethod: z.enum(["online", "cash", "split"]),
  prepaymentPercent: z.number().min(0).max(100).optional(),
  // هزینه ارسال — فعلاً بدون موتور محاسبه خودکار (نگاه کنید Known
  // Issues در CLAUDE.md)، پس مستقیماً از Client گرفته می‌شود؛ همان
  // ریسک پذیرفته‌شده‌ای که فرم سفارش Dashboard هم از قبل دارد.
  shippingCost: z.number().min(0).optional().default(0),
  // پرداخت ترکیبی: تا سقف موجودی واقعی کیف پول مشتری از مبلغ سفارش
  // کسر می‌شود، فقط باقیمانده به درگاه می‌رود.
  useWallet: z.boolean().optional().default(false),
  notes: z.string().trim().max(1000).optional().default(""),
});
