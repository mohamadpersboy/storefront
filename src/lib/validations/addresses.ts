import { z } from "zod";
import { shippingAddressSchema } from "@/lib/validations/orders";

/**
 * روی همان `shippingAddressSchema` (تعریف‌شده برای سفارش‌ها) بنا
 * می‌شود؛ فقط `title`/`isDefault` که مختص دفترچه آدرس هستند اضافه
 * می‌شوند — طبق همان دلیل مستندشده در `models/Address.ts`.
 */
export const createAddressSchema = shippingAddressSchema.extend({
  title: z.string().trim().min(2, "عنوان آدرس الزامی است").max(50),
  isDefault: z.boolean().optional(),
});

export const updateAddressSchema = createAddressSchema.partial();
