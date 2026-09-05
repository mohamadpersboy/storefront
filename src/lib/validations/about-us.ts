import { z } from "zod";

export const updateAboutUsSchema = z.object({
  title: z.string().trim().min(2, "عنوان باید حداقل ۲ حرف باشد").max(200),
  content: z.string().trim().min(1, "متن درباره ما نمی‌تواند خالی باشد"),
  imageUrl: z.union([z.string().trim().url("آدرس تصویر معتبر نیست"), z.literal("")]),
});

export type UpdateAboutUsInput = z.infer<typeof updateAboutUsSchema>;
