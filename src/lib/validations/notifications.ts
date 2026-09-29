import { z } from "zod";
import {
  ADMIN_NOTIFICATION_TYPES,
  NOTIFICATION_STATUSES,
  NOTIFICATION_TYPES,
} from "@/lib/notifications/constants";
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

const notificationFieldsSchema = z.object({
  type: z.enum(ADMIN_NOTIFICATION_TYPES),
  title: z.string().trim().min(2, "عنوان حداقل ۲ نویسه باشد").max(120, "عنوان حداکثر ۱۲۰ نویسه باشد"),
  /** HTML خام ادیتور؛ سرور قبل از ذخیره Sanitize می‌کند. */
  content: z.string().max(20000, "متن بیش از حد طولانی است"),
  imageUrl: optionalImage,
  link: optionalLink,
  publishAt: z.coerce.date().nullable().optional(),
  expiresAt: z.coerce.date().nullable().optional(),
  status: z.enum(NOTIFICATION_STATUSES),
});

const expiryAfterPublish = (data: { publishAt?: Date | null; expiresAt?: Date | null }) =>
  !data.publishAt || !data.expiresAt || data.publishAt < data.expiresAt;
const expiryMessage = {
  message: "زمان انقضا باید بعد از زمان انتشار باشد",
  path: ["expiresAt"],
};

// پیش‌فرض‌ها فقط برای ساخت‌اند. در ویرایش (PATCH) نباید اعمال شوند،
// وگرنه ارسال `{status}` به‌تنهایی نوع و متن اعلان را ریست می‌کرد.
export const createNotificationSchema = notificationFieldsSchema
  .extend({
    type: z.enum(ADMIN_NOTIFICATION_TYPES).default("announcement"),
    content: z.string().max(20000, "متن بیش از حد طولانی است").default(""),
    status: z.enum(["draft", "published"]).default("draft"),
  })
  .refine(expiryAfterPublish, expiryMessage);

export const updateNotificationSchema = notificationFieldsSchema
  .partial()
  .refine(expiryAfterPublish, expiryMessage);

export const adminNotificationsListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  search: z.string().trim().max(60).optional(),
  status: z.enum(NOTIFICATION_STATUSES).optional(),
  type: z.enum(NOTIFICATION_TYPES).optional(),
});
