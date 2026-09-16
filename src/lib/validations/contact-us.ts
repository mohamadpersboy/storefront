import { z } from "zod";

export const updateContactUsSchema = z.object({
  phone: z.string().trim().max(20).optional().default(""),
  secondaryPhone: z.string().trim().max(20).optional().default(""),
  email: z.union([z.string().trim().email("ایمیل معتبر نیست"), z.literal("")]).optional().default(""),
  address: z.string().trim().max(1000).optional().default(""),
  workingHours: z.string().trim().max(300).optional().default(""),
  latitude: z.number().min(-90).max(90).nullable().optional().default(null),
  longitude: z.number().min(-180).max(180).nullable().optional().default(null),
  supportAdminLink: z
    .union([z.string().trim().url("آدرس معتبر نیست"), z.literal("")])
    .optional()
    .default(""),
  telegramLink: z
    .union([z.string().trim().url("آدرس معتبر نیست"), z.literal("")])
    .optional()
    .default(""),
  whatsappLink: z
    .union([z.string().trim().url("آدرس معتبر نیست"), z.literal("")])
    .optional()
    .default(""),
  rubikaLink: z
    .union([z.string().trim().url("آدرس معتبر نیست"), z.literal("")])
    .optional()
    .default(""),
  eitaaLink: z
    .union([z.string().trim().url("آدرس معتبر نیست"), z.literal("")])
    .optional()
    .default(""),
});

export type UpdateContactUsInput = z.infer<typeof updateContactUsSchema>;
