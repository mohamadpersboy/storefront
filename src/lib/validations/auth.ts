import { z } from "zod";

// Iranian mobile numbers: 09xxxxxxxxx (11 digits, starts with 09)
export const phoneNumberSchema = z
  .string()
  .trim()
  .regex(/^09\d{9}$/, "شماره موبایل معتبر نیست");

export const otpRequestSchema = z.object({
  phoneNumber: phoneNumberSchema,
});

export const otpVerifySchema = z.object({
  phoneNumber: phoneNumberSchema,
  code: z.string().trim().regex(/^\d{4}$/, "کد تأیید باید ۴ رقم باشد"),
});
