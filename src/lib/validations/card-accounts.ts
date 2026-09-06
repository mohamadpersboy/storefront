import { z } from "zod";

const cardAccountFieldsSchema = z.object({
  cardNumber: z
    .string()
    .trim()
    .regex(/^\d{16}$/, "شماره کارت باید ۱۶ رقم باشد"),
  accountNumber: z.string().trim().min(4, "شماره حساب معتبر نیست").max(40),
  ownerName: z.string().trim().min(2, "نام صاحب حساب باید حداقل ۲ حرف باشد").max(80),
  isActive: z.boolean().optional(),
});

export const createCardAccountSchema = cardAccountFieldsSchema;
export const updateCardAccountSchema = cardAccountFieldsSchema.partial();
