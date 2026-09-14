import { z } from "zod";
import { cardNumberRegex, ibanRegex } from "@/lib/validations/wallet";

/**
 * همان الگوی Regex شماره کارت/شبا که برای درخواست برداشت
 * (`createWithdrawalRequestSchema`) تعریف شده، اینجا هم استفاده
 * می‌شود — بدون Duplicate کردن Regex.
 */
export const saveBankInfoSchema = z
  .object({
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
