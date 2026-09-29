import type { Types } from "mongoose";
import type { INotification } from "@/models/Notification";
import { makeExcerpt, sanitizeNotificationHtml } from "./sanitize";
import type { NotificationDetailDTO, NotificationDTO, NotificationDisplayState } from "./constants";

export type LeanNotification = INotification & { _id: Types.ObjectId };

export function toNotificationDTO(doc: LeanNotification, isRead: boolean): NotificationDTO {
  return {
    id: String(doc._id),
    type: doc.type,
    audience: doc.audience,
    title: doc.title,
    excerpt: makeExcerpt(doc.content, doc.contentFormat),
    imageUrl: doc.imageUrl ?? null,
    link: doc.link ?? null,
    isRead,
    publishAt: doc.publishAt.toISOString(),
    expiresAt: doc.expiresAt ? doc.expiresAt.toISOString() : null,
  };
}

export function toNotificationDetailDTO(
  doc: LeanNotification,
  isRead: boolean,
): NotificationDetailDTO {
  return {
    ...toNotificationDTO(doc, isRead),
    // دفاع در عمق: علاوه بر Sanitize هنگام ذخیره، هنگام خروجی هم.
    content:
      doc.contentFormat === "html" ? sanitizeNotificationHtml(doc.content) : doc.content,
    contentFormat: doc.contentFormat,
  };
}

/** وضعیت نمایشی برای Admin (از `status` و بازه زمانی، ذخیره نمی‌شود). */
export function getDisplayState(
  doc: Pick<INotification, "status" | "publishAt" | "expiresAt">,
  now: Date,
): NotificationDisplayState {
  if (doc.status === "draft") return "draft";
  if (doc.status === "archived") return "archived";
  if (doc.expiresAt && doc.expiresAt <= now) return "expired";
  if (doc.publishAt > now) return "scheduled";
  return "active";
}

export interface AdminNotificationDTO {
  id: string;
  type: INotification["type"];
  title: string;
  excerpt: string;
  status: INotification["status"];
  displayState: NotificationDisplayState;
  publishAt: string;
  expiresAt: string | null;
  createdAt: string;
}

export interface AdminNotificationDetailDTO extends AdminNotificationDTO {
  content: string;
  imageUrl: string | null;
  link: string | null;
}

export function toAdminNotificationDTO(doc: LeanNotification, now: Date): AdminNotificationDTO {
  return {
    id: String(doc._id),
    type: doc.type,
    title: doc.title,
    excerpt: makeExcerpt(doc.content, doc.contentFormat, 80),
    status: doc.status,
    displayState: getDisplayState(doc, now),
    publishAt: doc.publishAt.toISOString(),
    expiresAt: doc.expiresAt ? doc.expiresAt.toISOString() : null,
    createdAt: doc.createdAt.toISOString(),
  };
}

export function toAdminNotificationDetailDTO(
  doc: LeanNotification,
  now: Date,
): AdminNotificationDetailDTO {
  return {
    ...toAdminNotificationDTO(doc, now),
    content: doc.content,
    imageUrl: doc.imageUrl ?? null,
    link: doc.link ?? null,
  };
}
