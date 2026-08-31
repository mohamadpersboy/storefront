import { z } from "zod";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const addCartItemSchema = z.object({
  productId: z.string().regex(objectIdRegex, "محصول انتخاب‌شده معتبر نیست"),
  variantId: z.string().regex(objectIdRegex, "حالت انتخاب‌شده معتبر نیست"),
  quantity: z.number().int().min(1, "تعداد باید حداقل ۱ باشد").max(9999),
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(1, "تعداد باید حداقل ۱ باشد").max(9999),
});
