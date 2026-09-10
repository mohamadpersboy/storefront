import { z } from "zod";

const bannerFieldsSchema = z.object({
  title: z.string().trim().min(2, "عنوان باید حداقل ۲ حرف باشد").max(80),
  subtitle: z.string().trim().max(160, "توضیح کوتاه حداکثر ۱۶۰ حرف").nullable().optional(),
  ctaLabel: z.string().trim().max(30, "متن دکمه حداکثر ۳۰ حرف").nullable().optional(),
  href: z
    .string()
    .trim()
    .min(1, "لینک مقصد الزامی است")
    .refine(
      (value) => value.startsWith("/") || /^https?:\/\//.test(value),
      "لینک باید با / یا http شروع شود",
    ),
  imageUrl: z.string().trim().url("آدرس تصویر معتبر نیست"),
  imagePublicId: z.string().trim().min(1, "شناسه تصویر معتبر نیست"),
  imageBlurDataUrl: z.string().trim().nullable().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export const createBannerSchema = bannerFieldsSchema;
export const updateBannerSchema = bannerFieldsSchema.partial();
