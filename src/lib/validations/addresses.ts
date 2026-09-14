import { z } from "zod";
import { shippingAddressSchema } from "@/lib/validations/orders";
import { ADDRESS_TYPES } from "@/models/Address";

/**
 * روی همان `shippingAddressSchema` (تعریف‌شده برای سفارش‌ها) بنا
 * می‌شود؛ فقط `addressType`/`customTitle`/`isDefault` که مختص
 * دفترچه آدرس هستند اضافه می‌شوند — طبق همان دلیل مستندشده در
 * `models/Address.ts`.
 *
 * `customTitle` فقط وقتی `addressType` برابر `"other"` باشد الزامی
 * است — چک آن با `.refine` روی خودِ Object انجام می‌شود (نه با
 * `z.discriminatedUnion`، چون فرم همیشه هر دو فیلد را در State نگه
 * می‌دارد و ارسال می‌کند، حتی وقتی `customTitle` خالی/بی‌ربط است).
 */
const addressObjectSchema = shippingAddressSchema.extend({
  addressType: z.enum(ADDRESS_TYPES, { message: "نوع آدرس معتبر نیست" }),
  customTitle: z.string().trim().max(50).optional().or(z.literal("")),
  isDefault: z.boolean().optional(),
});

function requireCustomTitleForOther(data: { addressType?: string; customTitle?: string }) {
  return data.addressType !== "other" || Boolean(data.customTitle?.trim());
}

export const createAddressSchema = addressObjectSchema.refine(requireCustomTitleForOther, {
  message: "برای «سایر» باید یک عنوان دلخواه وارد کنید",
  path: ["customTitle"],
});

export const updateAddressSchema = addressObjectSchema
  .partial()
  .refine(requireCustomTitleForOther, {
    message: "برای «سایر» باید یک عنوان دلخواه وارد کنید",
    path: ["customTitle"],
  });
