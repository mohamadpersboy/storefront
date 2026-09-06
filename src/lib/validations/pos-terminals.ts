import { z } from "zod";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const posTerminalFieldsSchema = z.object({
  name: z.string().trim().min(2, "نام کارتخوان باید حداقل ۲ حرف باشد").max(60),
  bankId: z.string().regex(objectIdRegex, "بانک معتبر نیست"),
  accountNumber: z.string().trim().min(4, "شماره حساب معتبر نیست").max(40),
  isActive: z.boolean().optional(),
});

export const createPosTerminalSchema = posTerminalFieldsSchema;
export const updatePosTerminalSchema = posTerminalFieldsSchema.partial();
