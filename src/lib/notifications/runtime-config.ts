import { env } from "@/config/env";
import { resolveNotificationConfig, type NotificationConfig } from "./config";

/** فقط سمت سرور — از `env` اعتبارسنجی‌شده می‌خواند. */
export function getNotificationConfig(): NotificationConfig {
  return resolveNotificationConfig({
    timeZone: env.NOTIFICATION_TIMEZONE,
    specialOfferHour: env.SPECIAL_OFFER_NOTIFICATION_HOUR,
    specialOfferMinute: env.SPECIAL_OFFER_NOTIFICATION_MINUTE,
    couponExpiryReminderHours: env.COUPON_EXPIRY_REMINDER_HOURS,
  });
}
