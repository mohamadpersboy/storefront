import { z } from "zod";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const createAmazingOfferSchema = z
  .object({
    productId: z.string().regex(objectIdRegex, "محصول انتخاب‌شده معتبر نیست"),
    variantId: z.string().regex(objectIdRegex, "Variant انتخاب‌شده معتبر نیست"),
    discountType: z.enum(["percent", "fixed"]),
    discountValue: z.number().min(0, "مقدار تخفیف نمی‌تواند منفی باشد"),
    startAt: z.coerce.date(),
    endAt: z.coerce.date(),
  })
  .refine((data) => data.endAt.getTime() > data.startAt.getTime(), {
    message: "زمان پایان باید بعد از زمان شروع باشد",
    path: ["endAt"],
  })
  .refine(
    (data) => data.discountType !== "percent" || data.discountValue <= 100,
    {
      message: "درصد تخفیف نمی‌تواند بیشتر از ۱۰۰ باشد",
      path: ["discountValue"],
    },
  );

export const updateAmazingOfferSchema = z
  .object({
    discountType: z.enum(["percent", "fixed"]).optional(),
    discountValue: z.number().min(0).optional(),
    startAt: z.coerce.date().optional(),
    endAt: z.coerce.date().optional(),
    isActive: z.boolean().optional(),
  })
  .refine(
    (data) =>
      !data.startAt || !data.endAt || data.endAt.getTime() > data.startAt.getTime(),
    { message: "زمان پایان باید بعد از زمان شروع باشد", path: ["endAt"] },
  )
  .refine(
    (data) =>
      data.discountType !== "percent" ||
      data.discountValue === undefined ||
      data.discountValue <= 100,
    { message: "درصد تخفیف نمی‌تواند بیشتر از ۱۰۰ باشد", path: ["discountValue"] },
  );
