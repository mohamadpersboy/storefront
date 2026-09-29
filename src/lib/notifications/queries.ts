import mongoose from "mongoose";
import { Notification } from "@/models/Notification";
import { NotificationRead } from "@/models/NotificationRead";
import { User } from "@/models/User";
import { buildVisibleFilter, isNotificationRead, resolveSeenAt } from "./visibility";
import {
  toNotificationDTO,
  toNotificationDetailDTO,
  type LeanNotification,
} from "./serialize";
import type { NotificationDetailDTO, NotificationDTO } from "./constants";

/** فقط فیلدهای لازم از کاربر برای محاسبه Read State. */
export interface NotificationViewer {
  id: string;
  createdAt: Date;
  notificationsSeenAt?: Date | null;
}

export function viewerFromUser(user: {
  id: string;
  createdAt: Date;
  notificationsSeenAt?: Date | null;
}): NotificationViewer {
  return { id: user.id, createdAt: user.createdAt, notificationsSeenAt: user.notificationsSeenAt };
}

export interface NotificationListResult {
  items: NotificationDTO[];
  pagination: {
    totalDocs: number;
    totalPages: number;
    page: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

/**
 * لیست اعلان‌های قابل مشاهده، جدیدترین اول (`publishAt DESC`).
 * `viewer = null` → Guest: فقط عمومی، و همه `isRead: true` (Guest
 * Read State ندارد، پس هیچ‌چیز unread نشان داده نمی‌شود).
 */
export async function listVisibleNotifications(params: {
  viewer: NotificationViewer | null;
  page: number;
  limit: number;
  now?: Date;
}): Promise<NotificationListResult> {
  const now = params.now ?? new Date();
  const { viewer } = params;

  const result = await Notification.paginate(buildVisibleFilter(now, viewer?.id ?? null), {
    page: params.page,
    limit: params.limit,
    sort: { publishAt: -1, _id: -1 },
    lean: true,
  });

  const docs = result.docs as unknown as LeanNotification[];
  let readIds = new Set<string>();
  let seenAt: Date | null = null;

  if (viewer) {
    seenAt = resolveSeenAt(viewer.notificationsSeenAt, viewer.createdAt);
    if (docs.length > 0) {
      const reads = await NotificationRead.find({
        user: viewer.id,
        notification: { $in: docs.map((d) => d._id) },
      })
        .select("notification")
        .lean();
      readIds = new Set(reads.map((r) => String(r.notification)));
    }
  }

  return {
    items: docs.map((doc) =>
      toNotificationDTO(
        doc,
        viewer && seenAt
          ? isNotificationRead(doc.publishAt, seenAt, readIds.has(String(doc._id)))
          : true,
      ),
    ),
    pagination: {
      totalDocs: result.totalDocs,
      totalPages: result.totalPages,
      page: result.page ?? params.page,
      limit: result.limit,
      hasNextPage: result.hasNextPage,
      hasPrevPage: result.hasPrevPage,
    },
  };
}

/**
 * تعداد unread: فقط اعلان‌های قابل مشاهده که بعد از مبنا منتشر شده‌اند
 * و رکورد `NotificationRead` ندارند. Draft/Archived/Expired/Scheduled
 * در شرط قابل‌مشاهده‌بودن حذف می‌شوند و شمرده نمی‌شوند.
 */
export async function countUnreadNotifications(
  viewer: NotificationViewer,
  now = new Date(),
): Promise<number> {
  const seenAt = resolveSeenAt(viewer.notificationsSeenAt, viewer.createdAt);
  const unseen = { ...buildVisibleFilter(now, viewer.id), publishAt: { $lte: now, $gt: seenAt } };

  const total = await Notification.countDocuments(unseen);
  if (total === 0) return 0;

  // خواندن‌ها قبل از seenAt برای اعلان‌های جدیدتر از seenAt ممکن نیست
  // (خواندن یعنی قابل‌مشاهده بوده، پس publishAt ≤ readAt).
  const reads = await NotificationRead.find({ user: viewer.id, readAt: { $gt: seenAt } })
    .select("notification")
    .lean();
  if (reads.length === 0) return total;

  const readAndUnseen = await Notification.countDocuments({
    ...unseen,
    _id: { $in: reads.map((r) => r.notification) },
  });
  return Math.max(0, total - readAndUnseen);
}

/** جزئیات یک اعلان؛ فقط اگر برای این بیننده قابل مشاهده باشد وگرنه `null`. */
export async function getVisibleNotification(params: {
  id: string;
  viewer: NotificationViewer | null;
  now?: Date;
}): Promise<NotificationDetailDTO | null> {
  if (!mongoose.isValidObjectId(params.id)) return null;
  const now = params.now ?? new Date();

  const doc = (await Notification.findOne({
    ...buildVisibleFilter(now, params.viewer?.id ?? null),
    _id: params.id,
  }).lean()) as unknown as LeanNotification | null;
  if (!doc) return null;

  if (!params.viewer) return toNotificationDetailDTO(doc, true);

  const seenAt = resolveSeenAt(params.viewer.notificationsSeenAt, params.viewer.createdAt);
  const read = await NotificationRead.exists({ user: params.viewer.id, notification: doc._id });
  return toNotificationDetailDTO(doc, isNotificationRead(doc.publishAt, seenAt, Boolean(read)));
}

/** علامت خوانده‌شدن یک اعلان؛ `false` اگر اعلان برای این کاربر قابل مشاهده نباشد. */
export async function markNotificationRead(
  viewer: NotificationViewer,
  id: string,
  now = new Date(),
): Promise<boolean> {
  if (!mongoose.isValidObjectId(id)) return false;

  const visible = await Notification.exists({ ...buildVisibleFilter(now, viewer.id), _id: id });
  if (!visible) return false;

  await NotificationRead.updateOne(
    { user: viewer.id, notification: id },
    { $setOnInsert: { readAt: now } },
    { upsert: true },
  );
  return true;
}

/**
 * «خواندن همه» بدون به‌روزرسانی تک‌تک اعلان‌ها: فقط `notificationsSeenAt`
 * را جلو می‌برد (`$max`؛ هرگز عقب نمی‌رود). اعلان‌های زمان‌بندی‌شده
 * (`publishAt > now`) بعداً منتشر می‌شوند و همچنان unread می‌مانند.
 */
export async function markAllNotificationsRead(
  viewer: NotificationViewer,
  now = new Date(),
): Promise<void> {
  await User.updateOne({ _id: viewer.id }, { $max: { notificationsSeenAt: now } });
}
