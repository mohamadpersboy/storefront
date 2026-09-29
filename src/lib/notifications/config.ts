/**
 * تنظیمات اعلان — تابع خالص (بدون import از `@/config/env`) تا بدون
 * وابستگی به محیط قابل تست باشد. مقدار واقعی را `getNotificationConfig`
 * از `env` می‌گیرد.
 */
export interface NotificationConfig {
  timeZone: string;
  specialOfferHour: number;
  specialOfferMinute: number;
  couponExpiryReminderHours: number;
}

export const DEFAULT_NOTIFICATION_CONFIG: NotificationConfig = {
  timeZone: "Asia/Tehran",
  specialOfferHour: 10,
  specialOfferMinute: 0,
  couponExpiryReminderHours: 24,
};

/** اعلان روزانه شگفت‌انگیز چند ساعت قابل مشاهده بماند. */
export const DAILY_SPECIAL_OFFER_TTL_HOURS = 48;

function intInRange(value: unknown, min: number, max: number, fallback: number): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isInteger(n) && n >= min && n <= max ? n : fallback;
}

export function resolveNotificationConfig(
  input: Partial<Record<keyof NotificationConfig, unknown>> = {},
): NotificationConfig {
  const d = DEFAULT_NOTIFICATION_CONFIG;
  return {
    timeZone:
      typeof input.timeZone === "string" && isValidTimeZone(input.timeZone)
        ? input.timeZone
        : d.timeZone,
    specialOfferHour: intInRange(input.specialOfferHour, 0, 23, d.specialOfferHour),
    specialOfferMinute: intInRange(input.specialOfferMinute, 0, 59, d.specialOfferMinute),
    couponExpiryReminderHours: intInRange(
      input.couponExpiryReminderHours,
      1,
      168,
      d.couponExpiryReminderHours,
    ),
  };
}

export function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    return true;
  } catch {
    return false;
  }
}
