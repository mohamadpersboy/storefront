import type { INotification } from "@/models/Notification";
import { htmlHasContent, sanitizeNotificationHtml } from "./sanitize";
import type { NotificationStatus, NotificationType } from "./constants";

export interface AdminNotificationInput {
  type?: NotificationType;
  title?: string;
  content?: string;
  imageUrl?: string | null;
  link?: string | null;
  publishAt?: Date | null;
  expiresAt?: Date | null;
  status?: NotificationStatus;
}

export type AdminUpdateResult =
  | { ok: true; update: Partial<INotification> }
  | { ok: false; field: string; message: string };

/**
 * ویرایش اعلان عمومی توسط ادمین (تابع خالص، قابل تست).
 *
 * - محتوا همیشه در سرور Sanitize می‌شود.
 * - draft → published بدون `publishAt` صریح: `publishAt = now` (تازه
 *   منتشر شده حساب می‌شود و برای همه unread است).
 * - بازگرداندن از archived → published، `publishAt` قبلی را نگه می‌دارد.
 */
export function buildAdminUpdate(
  existing: Pick<INotification, "status" | "publishAt" | "expiresAt" | "content" | "imageUrl">,
  input: AdminNotificationInput,
  now: Date,
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

  if (input.publishAt !== undefined && input.publishAt !== null) {
    update.publishAt = input.publishAt;
  } else if (existing.status === "draft" && status === "published") {
    update.publishAt = now;
  }

  if (input.expiresAt !== undefined) update.expiresAt = input.expiresAt;

  const publishAt = update.publishAt ?? existing.publishAt;
  const expiresAt = input.expiresAt !== undefined ? input.expiresAt : existing.expiresAt;
  if (expiresAt && expiresAt <= publishAt) {
    return {
      ok: false,
      field: "expiresAt",
      message: "زمان انقضا باید بعد از زمان انتشار باشد",
    };
  }

  return { ok: true, update };
}

/** فقط Draft قابل حذف واقعی است؛ اعلان منتشرشده فقط Archive می‌شود. */
export function canHardDelete(status: NotificationStatus): boolean {
  return status === "draft";
}
