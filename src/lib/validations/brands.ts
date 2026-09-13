import { z } from "zod";

export const createBrandSchema = z.object({
  name: z.string().trim().min(2, "نام برند باید حداقل ۲ حرف باشد"),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9-]+$/, "Slug فقط می‌تواند شامل حروف انگلیسی، عدد و خط تیره باشد"),
  imageUrl: z.string().trim().url("آدرس تصویر معتبر نیست").nullable().optional(),
  imagePublicId: z.string().trim().nullable().optional(),
  imageBlurDataUrl: z.string().trim().nullable().optional(),
  isActive: z.boolean().optional().default(true),
  showOnHomepage: z.boolean().optional().default(false),
  sortOrder: z.number().int().optional().default(0),
});

export const updateBrandSchema = createBrandSchema.partial();
