import { z } from "zod";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const createCategorySchema = z.object({
  name: z.string().trim().min(2, "نام دسته‌بندی باید حداقل ۲ حرف باشد"),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9-]+$/, "Slug فقط می‌تواند شامل حروف انگلیسی، عدد و خط تیره باشد"),
  parentId: z
    .string()
    .regex(objectIdRegex, "شناسه دسته والد معتبر نیست")
    .nullable()
    .optional(),
  isActive: z.boolean().optional().default(true),
  sortOrder: z.number().int().optional().default(0),
});

export const updateCategorySchema = createCategorySchema.partial();
