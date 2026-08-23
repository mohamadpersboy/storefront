import { z } from "zod";

export const createColorSchema = z.object({
  name: z.string().trim().min(2, "نام رنگ باید حداقل ۲ حرف باشد"),
  hexCode: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^#[0-9A-F]{6}$/, "کد رنگ باید به‌صورت #RRGGBB باشد"),
  isActive: z.boolean().optional().default(true),
  sortOrder: z.number().int().optional().default(0),
});

export const updateColorSchema = createColorSchema.partial();
