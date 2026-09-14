import { z } from "zod";

export const adjustWalletSchema = z.object({
  type: z.enum(["credit", "debit"]),
  amount: z.number().int().positive("مبلغ باید بزرگ‌تر از صفر باشد"),
  reason: z.string().trim().min(3, "دلیل تعدیل الزامی است").max(300),
});

export const topupWalletSchema = z.object({
  amount: z.number().int().min(10_000, "حداقل مبلغ شارژ ۱۰,۰۰۰ تومان است").max(500_000_000),
});

export const cardNumberRegex = /^\d{16}$/;
export const ibanRegex = /^IR\d{24}$/i;

/**
 * فقط `amount` — طبق درخواست صریح کارفرما، مقصد واریز دیگر در لحظه
 * درخواست تسویه از کاربر پرسیده نمی‌شود؛ همیشه از «اطلاعات بانکی»
 * از‌قبل‌ذخیره‌شده (`CustomerBankAccount`) خوانده می‌شود — اگر کاربر
 * چنین رکوردی نداشته باشد، API اصلاً درخواست را نمی‌سازد (نگاه کنید
 * `api/v1/wallet/withdrawals/route.ts`).
 */
export const createWithdrawalRequestSchema = z.object({
  amount: z.number().int().min(50_000, "حداقل مبلغ برداشت ۵۰,۰۰۰ تومان است"),
});

export const reviewWithdrawalRequestSchema = z.object({
  action: z.enum(["approve", "reject"]),
  note: z.string().trim().max(300).optional(),
});
