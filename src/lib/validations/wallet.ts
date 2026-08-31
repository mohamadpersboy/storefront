import { z } from "zod";

export const adjustWalletSchema = z.object({
  type: z.enum(["credit", "debit"]),
  amount: z.number().int().positive("مبلغ باید بزرگ‌تر از صفر باشد"),
  reason: z.string().trim().min(3, "دلیل تعدیل الزامی است").max(300),
});
