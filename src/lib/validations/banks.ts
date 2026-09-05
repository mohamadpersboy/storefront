import { z } from "zod";

const bankFieldsSchema = z.object({
  name: z.string().trim().min(2, "نام بانک باید حداقل ۲ حرف باشد").max(60),
  logoUrl: z.string().trim().url("آدرس لوگو معتبر نیست").nullable().optional(),
  logoPublicId: z.string().trim().nullable().optional(),
  isActive: z.boolean().optional(),
});

export const createBankSchema = bankFieldsSchema;
export const updateBankSchema = bankFieldsSchema.partial();
