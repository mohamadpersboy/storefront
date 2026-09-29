import mongoose, { Schema, type Model, type HydratedDocument, type Types } from "mongoose";

/**
 * وضعیت «خوانده‌شدن» یک اعلان برای یک کاربر (هم عمومی، هم شخصی).
 * فقط وقتی کاربر یک اعلان را تکی باز/علامت بزند رکورد می‌سازد؛
 * «خواندن همه» رکورد نمی‌سازد و `User.notificationsSeenAt` را جلو می‌برد.
 */
export interface INotificationRead {
  user: Types.ObjectId;
  notification: Types.ObjectId;
  readAt: Date;
}

export type NotificationReadDocument = HydratedDocument<INotificationRead>;

const NotificationReadSchema = new Schema<INotificationRead>({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  notification: { type: Schema.Types.ObjectId, ref: "Notification", required: true },
  readAt: { type: Date, required: true, default: () => new Date() },
});

NotificationReadSchema.index({ user: 1, notification: 1 }, { unique: true });
// شمارش unread: فقط خواندنی‌های بعد از `notificationsSeenAt` لازم است.
NotificationReadSchema.index({ user: 1, readAt: -1 });

type NotificationReadModel = Model<INotificationRead>;

export const NotificationRead: NotificationReadModel =
  (mongoose.models.NotificationRead as NotificationReadModel) ||
  mongoose.model<INotificationRead, NotificationReadModel>(
    "NotificationRead",
    NotificationReadSchema,
  );
