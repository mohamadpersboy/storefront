import { z } from "zod";

export const createFaqSchema = z.object({
  question: z.string().trim().min(3, "سوال باید حداقل ۳ حرف باشد"),
  answer: z.string().trim().min(3, "پاسخ باید حداقل ۳ حرف باشد"),
  isActive: z.boolean().optional().default(true),
  sortOrder: z.number().int().optional().default(0),
});

export const updateFaqSchema = createFaqSchema.partial();

export type CreateFaqInput = z.infer<typeof createFaqSchema>;
export type UpdateFaqInput = z.infer<typeof updateFaqSchema>;
