import mongoose, { Schema, type Model, type HydratedDocument, type Types } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import type { PaginateModel } from "mongoose";
import "mongoose-paginate-v2";
import {
  NOTIFICATION_AUDIENCES,
  NOTIFICATION_STATUSES,
  NOTIFICATION_TYPES,
  type NotificationAudience,
  type NotificationContentFormat,
  type NotificationRefKind,
  type NotificationStatus,
  type NotificationType,
} from "@/lib/notifications/constants";

/**
 * یک رکورد برای هر اعلان.
 *
 * - `audience: "public"` → `user = null`، برای همه (Guest هم) دیده می‌شود.
 * - `audience: "user"`   → `user` = مالک؛ فقط خودش می‌بیند.
 *
 * Read State اینجا نیست: اعلان عمومی مشترک است ولی خوانده‌شدنش برای
 * هر کاربر متفاوت — `NotificationRead` + `User.notificationsSeenAt`.
 *
 * محتوا Snapshot است: متن/کد/مبلغ در لحظه ساخت ذخیره می‌شود و برای
 * نمایش تاریخی هرگز به Entity اصلی (Coupon/Order/...) وابسته نیست.
 * `ref` فقط برای ردیابی/لینک است.
 */
export interface INotification {
  audience: NotificationAudience;
  user: Types.ObjectId | null;
  type: NotificationType;
  title: string;
  /** اعلان شخصی همیشه `text`؛ عمومیِ ادمین `html` (Sanitize‌شده در سرور). */
  content: string;
  contentFormat: NotificationContentFormat;
  imageUrl: string | null;
  link: string | null;
  ref: { kind: NotificationRefKind; id: Types.ObjectId } | null;
  status: NotificationStatus;
  /** زمان شروع نمایش؛ زمان‌بندی = `publishAt` در آینده + `status: published`. */
  publishAt: Date;
  /** اعلان منقضی حذف نمی‌شود، فقط از Queryهای نمایش خارج می‌شود. */
  expiresAt: Date | null;
  /** برای اعلان‌های خودکار (جلوگیری از Duplicate). فقط وقتی مقدار دارد ایندکس یکتا. */
  dedupeKey?: string;
  createdBy: Types.ObjectId | null; // ref User — ادمین سازنده؛ برای خودکار null
  createdAt: Date;
  updatedAt: Date;
}

export type NotificationDocument = HydratedDocument<INotification>;

const NotificationSchema = new Schema<INotification>(
  {
    audience: { type: String, enum: NOTIFICATION_AUDIENCES, required: true },
    user: { type: Schema.Types.ObjectId, ref: "User", default: null },
    type: { type: String, enum: NOTIFICATION_TYPES, required: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    content: { type: String, default: "", maxlength: 20000 },
    contentFormat: { type: String, enum: ["text", "html"], default: "text" },
    imageUrl: { type: String, default: null },
    link: { type: String, default: null },
    ref: {
      type: new Schema(
        {
          kind: { type: String, enum: ["coupon", "order", "referral", "amazing_offer"], required: true },
          id: { type: Schema.Types.ObjectId, required: true },
        },
        { _id: false },
      ),
      default: null,
    },
    status: { type: String, enum: NOTIFICATION_STATUSES, default: "published" },
    publishAt: { type: Date, required: true, default: () => new Date() },
    expiresAt: { type: Date, default: null },
    dedupeKey: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true },
);

// لیست/شمارش اعلان عمومی برای همه (Guest و کاربر).
NotificationSchema.index({ audience: 1, status: 1, publishAt: -1 });
// اعلان شخصی یک کاربر.
NotificationSchema.index({ user: 1, status: 1, publishAt: -1 });
// جلوگیری از اعلان خودکار تکراری (اجرای دوباره Cron، رویداد تکراری).
NotificationSchema.index(
  { dedupeKey: 1 },
  { unique: true, partialFilterExpression: { dedupeKey: { $type: "string" } } },
);
// لیست Admin.
NotificationSchema.index({ audience: 1, createdAt: -1 });

NotificationSchema.plugin(mongoosePaginate);

type NotificationModel = Model<INotification> & PaginateModel<INotification>;

export const Notification: NotificationModel =
  (mongoose.models.Notification as NotificationModel) ||
  mongoose.model<INotification, NotificationModel>("Notification", NotificationSchema);
