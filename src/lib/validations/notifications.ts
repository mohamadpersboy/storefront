import { z } from "zod";
import {
  ADMIN_NOTIFICATION_TYPES,
  NOTIFICATION_STATUSES,
  NOTIFICATION_TYPES,
} from "@/lib/notifications/constants";
import { isDateOnly, isValidDateOnly } from "@/lib/notifications/dates";
import { isSafeNotificationImageUrl, isSafeNotificationLink } from "@/lib/notifications/links";

/** لیست اعلان‌های بیننده (Guest/کاربر): Pagination استاندارد پروژه `page`/`limit`. */
export const notificationsListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

const linkSchema = z
  .string()
  .trim()
  .refine(isSafeNotificationLink, "لینک باید مسیر داخلی (با /) یا آدرس https باشد");

const imageSchema = z
  .string()
  .trim()
  .refine(isSafeNotificationImageUrl, "تصویر باید از آپلودر سایت باشد");

const optionalLink = z.union([linkSchema, z.literal("").transform(() => null), z.null()]).optional();
const optionalImage = z
  .union([imageSchema, z.literal("").transform(() => null), z.null()])
  .optional();

/**
 * تاریخ ادمین: `YYYY-MM-DD` (تاریخ‌-فقط از انتخابگر؛ سرور با Time Zone
 * کسب‌وکار تفسیر می‌کند) یا زمان کامل ISO (مقدار دست‌نخورده).
 */
const adminDate = z.string().transform((value, ctx): string | Date => {
  if (isDateOnly(value)) {
    if (isValidDateOnly(value)) return value;
    ctx.addIssue({ code: "custom", message: "تاریخ نامعتبر است" });
    return z.NEVER;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    ctx.addIssue({ code: "custom", message: "تاریخ نامعتبر است" });
    return z.NEVER;
  }
  return parsed;
});

const notificationFieldsSchema = z.object({
  type: z.enum(ADMIN_NOTIFICATION_TYPES),
  title: z.string().trim().min(2, "عنوان حداقل ۲ نویسه باشد").max(120, "عنوان حداکثر ۱۲۰ نویسه باشد"),
  /** HTML خام ادیتور؛ سرور قبل از ذخیره Sanitize می‌کند. */
  content: z.string().max(20000, "متن بیش از حد طولانی است"),
  imageUrl: optionalImage,
  link: optionalLink,
  publishAt: adminDate.nullable().optional(),
  expiresAt: adminDate.nullable().optional(),
  status: z.enum(NOTIFICATION_STATUSES),
});

// ترتیب انتشار/انقضا بعد از تفسیر Time Zone در `admin.ts` بررسی می‌شود
// (تاریخ‌-فقط را نمی‌توان اینجا مقایسه کرد).
// پیش‌فرض‌ها فقط برای ساخت‌اند. در ویرایش (PATCH) نباید اعمال شوند،
// وگرنه ارسال `{status}` به‌تنهایی نوع و متن اعلان را ریست می‌کرد.
export const createNotificationSchema = notificationFieldsSchema
  .extend({
    type: z.enum(ADMIN_NOTIFICATION_TYPES).default("announcement"),
    content: z.string().max(20000, "متن بیش از حد طولانی است").default(""),
    status: z.enum(["draft", "published"]).default("draft"),
  });

export const updateNotificationSchema = notificationFieldsSchema.partial();

export const adminNotificationsListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  search: z.string().trim().max(60).optional(),
  status: z.enum(NOTIFICATION_STATUSES).optional(),
  type: z.enum(NOTIFICATION_TYPES).optional(),
});
