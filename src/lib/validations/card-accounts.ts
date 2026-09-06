import { z } from "zod";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;
// شبای ایران: IR + ۲۴ رقم (نمایش رایج بدون فاصله)
const shabaRegex = /^IR\d{24}$/i;

const cardAccountFieldsSchema = z.object({
  cardNumber: z
    .string()
    .trim()
    .regex(/^\d{16}$/, "شماره کارت باید ۱۶ رقم باشد"),
  shabaNumber: z
    .string()
    .trim()
    .toUpperCase()
    .regex(shabaRegex, "شماره شبا باید به‌صورت IR و ۲۴ رقم باشد"),
  bankId: z.string().regex(objectIdRegex, "بانک معتبر نیست"),
  accountNumber: z.string().trim().min(4, "شماره حساب معتبر نیست").max(40),
  ownerName: z.string().trim().min(2, "نام صاحب حساب باید حداقل ۲ حرف باشد").max(80),
  isActive: z.boolean().optional(),
});

export const createCardAccountSchema = cardAccountFieldsSchema;
export const updateCardAccountSchema = cardAccountFieldsSchema.partial();

export const sendCardAccountSchema = z.object({
  phoneNumber: z.string().trim().regex(/^09\d{9}$/, "شماره موبایل معتبر نیست"),
});
