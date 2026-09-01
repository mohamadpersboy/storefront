import { z } from "zod";

export const adjustWalletSchema = z.object({
  type: z.enum(["credit", "debit"]),
  amount: z.number().int().positive("مبلغ باید بزرگ‌تر از صفر باشد"),
  reason: z.string().trim().min(3, "دلیل تعدیل الزامی است").max(300),
});

export const topupWalletSchema = z.object({
  amount: z.number().int().min(10_000, "حداقل مبلغ شارژ ۱۰,۰۰۰ تومان است").max(500_000_000),
});

const cardNumberRegex = /^\d{16}$/;
const ibanRegex = /^IR\d{24}$/i;

export const createWithdrawalRequestSchema = z
  .object({
    amount: z.number().int().min(50_000, "حداقل مبلغ برداشت ۵۰,۰۰۰ تومان است"),
    ownerName: z.string().trim().min(2, "نام صاحب حساب الزامی است"),
    cardNumber: z
      .string()
      .trim()
      .regex(cardNumberRegex, "شماره کارت باید ۱۶ رقم باشد")
      .optional()
      .or(z.literal("")),
    iban: z
      .string()
      .trim()
      .toUpperCase()
      .regex(ibanRegex, "شماره شبا باید با IR شروع شود و ۲۴ رقم داشته باشد")
      .optional()
      .or(z.literal("")),
  })
  .refine((data) => Boolean(data.cardNumber) || Boolean(data.iban), {
    message: "شماره کارت یا شماره شبا الزامی است",
    path: ["cardNumber"],
  });

export const reviewWithdrawalRequestSchema = z.object({
  action: z.enum(["approve", "reject"]),
  note: z.string().trim().max(300).optional(),
});
