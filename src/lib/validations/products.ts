import { z } from "zod";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const variantAttributeSchema = z.object({
  name: z.string().trim().min(1, "نام ویژگی الزامی است"),
  value: z.string().trim().min(1, "مقدار ویژگی الزامی است"),
});

const variantSchema = z.object({
  unit: z.string().trim().min(1, "واحد فروش الزامی است"),
  attributes: z.array(variantAttributeSchema).default([]),
  sku: z.string().trim().optional(),
  price: z.number().min(0, "قیمت نمی‌تواند منفی باشد"),
  discountPercent: z.number().min(0).max(100).default(0),
  discountAmount: z.number().min(0).default(0),
  stock: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

const technicalSpecSchema = z.object({
  key: z.string().trim().min(1),
  value: z.string().trim().min(1),
});

const imageSchema = z.object({
  url: z.string().url(),
  publicId: z.string().min(1),
});

export const createProductSchema = z.object({
  title: z.string().trim().min(2, "عنوان محصول باید حداقل ۲ حرف باشد"),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9-]+$/, "Slug فقط می‌تواند شامل حروف انگلیسی، عدد و خط تیره باشد"),
  description: z.string().trim().optional(),
  technicalDescription: z.string().trim().optional(),
  technicalSpecifications: z.array(technicalSpecSchema).default([]),
  category: z.string().regex(objectIdRegex, "دسته‌بندی معتبر نیست"),
  images: z.array(imageSchema).max(10, "حداکثر ۱۰ تصویر مجاز است").default([]),
  variants: z
    .array(variantSchema)
    .min(1, "حداقل یک Variant لازم است"),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
  seo: z
    .object({
      title: z.string().trim().optional(),
      description: z.string().trim().optional(),
    })
    .default({}),
});

export const updateProductSchema = createProductSchema.partial();

export const productsListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  search: z.string().trim().max(100).optional(),
  category: z.string().regex(objectIdRegex).optional(),
  status: z.enum(["draft", "published", "archived"]).optional(),
});
