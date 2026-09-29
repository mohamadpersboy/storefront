/**
 * ثابت‌ها و نوع‌های اعلان که هم سمت سرور و هم Client Component
 * می‌توانند import کنند — عمداً هیچ import سروری (env/mongoose) ندارد.
 */
export const NOTIFICATION_TYPES = [
  "announcement",
  "promotion",
  "coupon",
  "special_offer",
  "order",
  "referral",
  "coupon_expiry",
  "system",
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

/** Typeهایی که ادمین می‌تواند دستی برای اعلان عمومی انتخاب کند. */
export const ADMIN_NOTIFICATION_TYPES = [
  "announcement",
  "promotion",
  "coupon",
  "special_offer",
  "system",
] as const satisfies readonly NotificationType[];

export const NOTIFICATION_AUDIENCES = ["public", "user"] as const;
export type NotificationAudience = (typeof NOTIFICATION_AUDIENCES)[number];

export const NOTIFICATION_STATUSES = ["draft", "published", "archived"] as const;
export type NotificationStatus = (typeof NOTIFICATION_STATUSES)[number];

export type NotificationContentFormat = "text" | "html";

export type NotificationRefKind = "coupon" | "order" | "referral" | "amazing_offer";

/** تعداد اعلان در پاپ‌آپ Bell؛ صفحه کامل `/notifications` Pagination دارد. */
export const POPUP_LIMIT = 5;
export const PAGE_SIZE = 10;

/**
 * وضعیت نمایشی اعلان برای Admin؛ از `status` + بازه زمانی محاسبه
 * می‌شود (ذخیره نمی‌شود).
 */
export type NotificationDisplayState =
  | "draft"
  | "scheduled"
  | "active"
  | "expired"
  | "archived";

/** شکل اعلان در پاسخ API/UI (همیشه Snapshot، نه وابسته به Entity اصلی). */
export interface NotificationDTO {
  id: string;
  type: NotificationType;
  audience: NotificationAudience;
  title: string;
  /** خلاصه متن ساده (برای لیست/پاپ‌آپ). */
  excerpt: string;
  imageUrl: string | null;
  link: string | null;
  /** برای Guest همیشه `true` است (Read State ندارد). */
  isRead: boolean;
  publishAt: string;
  expiresAt: string | null;
}

export interface NotificationDetailDTO extends NotificationDTO {
  /** متن کامل؛ اگر `contentFormat === "html"` قبلاً Sanitize شده است. */
  content: string;
  contentFormat: NotificationContentFormat;
}
