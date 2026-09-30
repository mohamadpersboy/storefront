import type { INotification } from "@/models/Notification";
import { DEFAULT_NOTIFICATION_CONFIG } from "./config";
import { resolveAdminDate, type AdminDateInput } from "./dates";
import { htmlHasContent, sanitizeNotificationHtml } from "./sanitize";
import type { NotificationStatus, NotificationType } from "./constants";

export interface AdminNotificationInput {
  type?: NotificationType;
  title?: string;
  content?: string;
  imageUrl?: string | null;
  link?: string | null;
  /** `YYYY-MM-DD` (تفسیر: ابتدای روز محلی) یا زمان کامل. */
  publishAt?: AdminDateInput;
  /** `YYYY-MM-DD` (تفسیر: انتهای روز محلی) یا زمان کامل. */
  expiresAt?: AdminDateInput;
  status?: NotificationStatus;
}

export type AdminFieldError = { ok: false; field: string; message: string };
export type AdminUpdateResult = { ok: true; update: Partial<INotification> } | AdminFieldError;

const EXPIRY_ORDER_MESSAGE = "زمان انقضا باید بعد از زمان انتشار باشد";

/**
 * انتشار = نمایش از همین لحظه. اگر زمان درخواستیِ انتشار گذشته (یا
 * همین لحظه) باشد، `now` می‌شود؛ وگرنه اعلان «قدیمی» حساب می‌شود و برای
 * کاربری که «خواندن همه» زده خوانده دیده می‌شود.
 */
export function resolvePublishAt(requested: Date | null | undefined, now: Date): Date {
  return requested && requested > now ? requested : now;
}

/** ساخت اعلان عمومی توسط ادمین (تابع خالص، قابل تست). */
export function buildAdminCreate(
  input: Required<Pick<AdminNotificationInput, "type" | "title">> &
    Omit<AdminNotificationInput, "type" | "title"> & { status: "draft" | "published" },
  now: Date,
  timeZone: string = DEFAULT_NOTIFICATION_CONFIG.timeZone,
):
  | {
      ok: true;
      fields: {
        content: string;
        publishAt: Date;
        expiresAt: Date | null;
      };
    }
  | AdminFieldError {
  const content = sanitizeNotificationHtml(input.content ?? "");
  if (!htmlHasContent(content) && !input.imageUrl) {
    return { ok: false, field: "content", message: "متن یا تصویر اعلان نمی‌تواند خالی باشد" };
  }

  const requested = resolveAdminDate(input.publishAt, "start", timeZone);
  const publishAt =
    input.status === "published" ? resolvePublishAt(requested, now) : (requested ?? now);
  const expiresAt = resolveAdminDate(input.expiresAt, "end", timeZone) ?? null;

  if (expiresAt && expiresAt <= publishAt) {
    return { ok: false, field: "expiresAt", message: EXPIRY_ORDER_MESSAGE };
  }
  return { ok: true, fields: { content, publishAt, expiresAt } };
}

/**
 * ویرایش اعلان عمومی توسط ادمین (تابع خالص، قابل تست).
 *
 * - محتوا همیشه در سرور Sanitize می‌شود.
 * - Draft → Published: `publishAt` = max(درخواستی، now). بدون مقدار جدید،
 *   زمانِ آینده‌ی ذخیره‌شده‌ی پیش‌نویس حفظ می‌شود؛ `null` = «همین حالا».
 * - بعد از «زنده شدن» اعلان (`status ≠ draft` و `publishAt ≤ now`):
 *   `publishAt` هرگز به آینده منتقل نمی‌شود (۴۲۲)، و مقدار گذشته/برابر
 *   نادیده گرفته می‌شود. زمان‌بندی جدید = اعلان جدید. این‌گونه Read State
 *   (`notificationsSeenAt`) خراب نمی‌شود.
 * - اعلانِ منتشرشده‌ی هنوز زمان‌بندی‌شده (`publishAt > now`) آزادانه
 *   قابل تغییر است (هنوز برای کسی دیده نشده).
 * - Archived → Published همان `publishAt` قبلی را نگه می‌دارد.
 */
export function buildAdminUpdate(
  existing: Pick<INotification, "status" | "publishAt" | "expiresAt" | "content" | "imageUrl">,
  input: AdminNotificationInput,
  now: Date,
  timeZone: string = DEFAULT_NOTIFICATION_CONFIG.timeZone,
): AdminUpdateResult {
  const update: Partial<INotification> = {};

  if (input.type !== undefined) update.type = input.type;
  if (input.title !== undefined) update.title = input.title;
  if (input.imageUrl !== undefined) update.imageUrl = input.imageUrl;
  if (input.link !== undefined) update.link = input.link;

  let content = existing.content;
  if (input.content !== undefined) {
    content = sanitizeNotificationHtml(input.content);
    update.content = content;
    update.contentFormat = "html";
  }

  const imageUrl = input.imageUrl !== undefined ? input.imageUrl : existing.imageUrl;
  const status = input.status ?? existing.status;

  if (status !== "draft" && !htmlHasContent(content) && !imageUrl) {
    return { ok: false, field: "content", message: "متن یا تصویر اعلان نمی‌تواند خالی باشد" };
  }

  if (input.status !== undefined) update.status = input.status;

  const requested = resolveAdminDate(input.publishAt, "start", timeZone);
  let publishAt = existing.publishAt;

  if (existing.status === "draft") {
    if (status === "published") {
      publishAt = resolvePublishAt(requested === undefined ? existing.publishAt : requested, now);
      update.publishAt = publishAt;
    } else if (requested) {
      publishAt = requested;
      update.publishAt = publishAt;
    }
  } else if (existing.publishAt <= now) {
    // اعلان زنده (یا زمانی زنده بوده): `publishAt` ثابت است.
    if (requested && requested > now) {
      return {
        ok: false,
        field: "publishAt",
        message: "زمان انتشار بعد از انتشار قابل انتقال به آینده نیست؛ اعلان جدید بسازید",
      };
    }
  } else if (requested) {
    // هنوز زمان‌بندی‌شده و دیده‌نشده.
    publishAt = resolvePublishAt(requested, now);
    update.publishAt = publishAt;
  }

  if (input.expiresAt !== undefined) {
    update.expiresAt = resolveAdminDate(input.expiresAt, "end", timeZone) ?? null;
  }
  const expiresAt = input.expiresAt !== undefined ? (update.expiresAt ?? null) : existing.expiresAt;
  if (expiresAt && expiresAt <= publishAt) {
    return { ok: false, field: "expiresAt", message: EXPIRY_ORDER_MESSAGE };
  }

  return { ok: true, update };
}

/** فقط Draft قابل حذف واقعی است؛ اعلان منتشرشده فقط Archive می‌شود. */
export function canHardDelete(status: NotificationStatus): boolean {
  return status === "draft";
}
