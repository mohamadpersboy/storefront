import type { Types } from "mongoose";
import { Notification, type INotification } from "@/models/Notification";
import { sanitizeNotificationHtml } from "./sanitize";
import { isSafeNotificationImageUrl, isSafeNotificationLink } from "./links";
import type {
  NotificationAudience,
  NotificationContentFormat,
  NotificationRefKind,
  NotificationStatus,
  NotificationType,
} from "./constants";

/**
 * تنها نقطه ساخت اعلان (Service Layer). Route/Serviceهای دامنه
 * (Order, Coupon, Referral, Cron, Admin) فقط این‌جا را صدا می‌زنند —
 * نه `Notification.create` مستقیم.
 */
export interface NewNotification {
  audience: NotificationAudience;
  /** برای `audience: "user"` الزامی است. */
  userId?: string | Types.ObjectId | null;
  type: NotificationType;
  title: string;
  content?: string;
  /** اعلان شخصی همیشه `text` ذخیره می‌شود، هر مقداری که بدهید. */
  contentFormat?: NotificationContentFormat;
  imageUrl?: string | null;
  link?: string | null;
  ref?: { kind: NotificationRefKind; id: string | Types.ObjectId } | null;
  status?: NotificationStatus;
  publishAt?: Date;
  expiresAt?: Date | null;
  /** کلید یکتا برای اعلان خودکار؛ ساخت دوباره با همین کلید بی‌اثر است. */
  dedupeKey?: string;
  createdBy?: string | Types.ObjectId | null;
}

export function buildNotificationDoc(input: NewNotification, now = new Date()) {
  if (input.audience === "user" && !input.userId) {
    throw new Error("Personal notification requires userId");
  }
  if (input.audience === "public" && input.userId) {
    throw new Error("Public notification must not have userId");
  }

  const isPersonal = input.audience === "user";
  const contentFormat: NotificationContentFormat = isPersonal
    ? "text"
    : (input.contentFormat ?? "text");
  const rawContent = input.content ?? "";
  const content = contentFormat === "html" ? sanitizeNotificationHtml(rawContent) : rawContent;

  return {
    audience: input.audience,
    user: isPersonal ? input.userId : null,
    type: input.type,
    title: input.title.trim(),
    content,
    contentFormat,
    imageUrl:
      input.imageUrl && isSafeNotificationImageUrl(input.imageUrl) ? input.imageUrl : null,
    link: input.link && isSafeNotificationLink(input.link) ? input.link : null,
    ref: input.ref ?? null,
    status: input.status ?? "published",
    publishAt: input.publishAt ?? now,
    expiresAt: input.expiresAt ?? null,
    ...(input.dedupeKey ? { dedupeKey: input.dedupeKey } : {}),
    createdBy: input.createdBy ?? null,
  } as Partial<INotification>;
}

interface MongoErrorLike {
  code?: number;
  writeErrors?: Array<{ code?: number; err?: { code?: number } }>;
}

export function isDuplicateKeyError(error: unknown): boolean {
  return (error as MongoErrorLike | null)?.code === 11000;
}

/** یک اعلان می‌سازد؛ اگر `dedupeKey` تکراری باشد `created: false` (نه خطا). */
export async function createNotification(
  input: NewNotification,
): Promise<{ created: boolean; id: string | null }> {
  try {
    const doc = await Notification.create(buildNotificationDoc(input));
    return { created: true, id: String(doc._id) };
  } catch (error) {
    if (isDuplicateKeyError(error)) return { created: false, id: null };
    throw error;
  }
}

/** ساخت گروهی (مثلاً اعلان شخصی برای چند کاربر)؛ تکراری‌ها ساخته نمی‌شوند. */
export async function createNotifications(
  inputs: NewNotification[],
): Promise<{ created: number }> {
  if (inputs.length === 0) return { created: 0 };
  const docs = inputs.map((input) => buildNotificationDoc(input));
  try {
    const inserted = await Notification.insertMany(docs, { ordered: false });
    return { created: inserted.length };
  } catch (error) {
    const writeErrors = (error as MongoErrorLike).writeErrors;
    if (
      Array.isArray(writeErrors) &&
      writeErrors.length > 0 &&
      writeErrors.every((w) => (w.code ?? w.err?.code) === 11000)
    ) {
      return { created: docs.length - writeErrors.length };
    }
    if (isDuplicateKeyError(error) && !writeErrors) return { created: 0 };
    throw error;
  }
}

/**
 * Best-effort: شکست ساخت اعلان اطلاعاتی هرگز عملیات اصلی (سفارش،
 * پرداخت، رفرال، ...) را Fail نمی‌کند. فقط برای اعلان‌های صرفاً
 * اطلاع‌رسانی؛ ساخت دستی توسط ادمین از `createNotification` استفاده
 * می‌کند تا خطا به کاربر برسد.
 */
export async function safeCreateNotification(input: NewNotification): Promise<void> {
  try {
    await createNotification(input);
  } catch (error) {
    console.error("Failed to create notification:", error);
  }
}

export async function safeCreateNotifications(inputs: NewNotification[]): Promise<void> {
  try {
    await createNotifications(inputs);
  } catch (error) {
    console.error("Failed to create notifications:", error);
  }
}
