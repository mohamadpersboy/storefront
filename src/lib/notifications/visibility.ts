import type { QueryFilter } from "mongoose";
import type { INotification } from "@/models/Notification";

/**
 * تنها تعریف «اعلان قابل مشاهده» در کل سیستم (لیست، شمارش، جزئیات،
 * mark-read). بخش‌های دیگر نباید شرط را دوباره بنویسند.
 *
 * - `published` و `publishAt <= now`
 * - `expiresAt` خالی یا در آینده
 * - Guest (`userId = null`): فقط `public`
 * - کاربر: `public` + اعلان `user` متعلق به خودش
 */
export function buildVisibleFilter(now: Date, userId: string | null): QueryFilter<INotification> {
  const audience: QueryFilter<INotification> = userId
    ? { $or: [{ audience: "public" }, { audience: "user", user: userId }] }
    : { audience: "public" };

  return {
    status: "published",
    publishAt: { $lte: now },
    $and: [{ $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }] }, audience],
  };
}

/**
 * مبنای «دیده‌شده»: `notificationsSeenAt` یا `createdAt` کاربر، هرکدام
 * دیرتر است — پس اعلانِ قدیمی‌تر از ثبت‌نام هرگز unread نمی‌شود.
 */
export function resolveSeenAt(
  notificationsSeenAt: Date | null | undefined,
  userCreatedAt: Date,
): Date {
  if (!notificationsSeenAt) return userCreatedAt;
  return notificationsSeenAt > userCreatedAt ? notificationsSeenAt : userCreatedAt;
}

/** خوانده‌شده = قدیمی‌تر از مبنا، یا رکورد `NotificationRead` دارد. */
export function isNotificationRead(
  publishAt: Date,
  seenAt: Date,
  hasReadRecord: boolean,
): boolean {
  return publishAt <= seenAt || hasReadRecord;
}
