import { z } from "zod";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const couponFieldsSchema = z.object({
  code: z
    .string()
    .trim()
    .min(3, "کد باید حداقل ۳ کاراکتر باشد")
    .max(30, "کد نمی‌تواند بیشتر از ۳۰ کاراکتر باشد")
    .regex(/^[A-Za-z0-9_-]+$/, "کد فقط می‌تواند شامل حروف انگلیسی، عدد، خط تیره و زیرخط باشد"),
  discountPercentage: z.number().min(0, "درصد تخفیف نمی‌تواند منفی باشد").max(100, "درصد تخفیف نمی‌تواند بیشتر از ۱۰۰ باشد"),
  maxDiscountAmount: z.number().min(0).nullable().optional(),
  minOrderAmount: z.number().min(0).default(0),
  startsAt: z.coerce.date().nullable().optional(),
  expiresAt: z.coerce.date(),
  status: z.enum(["active", "inactive"]).default("active"),
  type: z.enum(["public", "private"]).default("public"),
  allowedUserIds: z.array(z.string().regex(objectIdRegex)).default([]),
  usageLimit: z.number().int().min(1).nullable().optional(),
  perUserLimit: z.number().int().min(1).nullable().optional(),
});

export const createCouponSchema = couponFieldsSchema
  .refine((data) => data.type !== "private" || data.allowedUserIds.length > 0, {
    message: "برای کد تخفیف خصوصی باید حداقل یک کاربر انتخاب شود",
    path: ["allowedUserIds"],
  })
  .refine((data) => !data.startsAt || data.startsAt < data.expiresAt, {
    message: "تاریخ شروع باید قبل از تاریخ انقضا باشد",
    path: ["startsAt"],
  });

export const updateCouponSchema = couponFieldsSchema.partial().refine(
  (data) => !data.startsAt || !data.expiresAt || data.startsAt < data.expiresAt,
  { message: "تاریخ شروع باید قبل از تاریخ انقضا باشد", path: ["startsAt"] },
);

export const couponsListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  search: z.string().trim().max(50).optional(),
  status: z.enum(["active", "inactive"]).optional(),
});
