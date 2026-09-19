import { z } from "zod";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const toggleFavoriteSchema = z.object({
  productId: z.string().regex(objectIdRegex, "محصول انتخاب‌شده معتبر نیست"),
});
