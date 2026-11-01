import { localDateKey } from "./timezone";

/** Time Zone نمایش اعلان‌ها (هم‌راستا با پیش‌فرض کسب‌وکار). */
export const CHAT_TIME_ZONE = "Asia/Tehran";

const DAY_MS = 24 * 60 * 60 * 1000;

/** ساعت پیام، مثل «۱۵:۰۲». */
export function formatChatClock(iso: string, timeZone: string = CHAT_TIME_ZONE): string {
  return new Intl.DateTimeFormat("fa-IR", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(iso));
}

/** کلید روز محلی (`YYYY-MM-DD`) برای گروه‌بندی پیام‌ها. */
export function chatDayKey(iso: string, timeZone: string = CHAT_TIME_ZONE): string {
  return localDateKey(new Date(iso), timeZone);
}

function persianYear(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("fa-IR-u-ca-persian", { timeZone, year: "numeric" }).format(date);
}

/** برچسب جداکنندهٔ روز: «امروز»، «دیروز»، «۱۲ آبان» (و سال اگر سال فرق کند). */
export function formatChatDayLabel(
  iso: string,
  now: Date = new Date(),
  timeZone: string = CHAT_TIME_ZONE,
): string {
  const date = new Date(iso);
  const key = localDateKey(date, timeZone);
  if (key === localDateKey(now, timeZone)) return "امروز";
  if (key === localDateKey(new Date(now.getTime() - DAY_MS), timeZone)) return "دیروز";

  const sameYear = persianYear(date, timeZone) === persianYear(now, timeZone);
  return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    timeZone,
    day: "numeric",
    month: "long",
    ...(sameYear ? {} : { year: "numeric" }),
  }).format(date);
}

/** دکمهٔ لینک اعلان بر اساس نوع؛ برچسب فارسی مناسب هر مقصد. */
export function notificationLinkLabel(type: string): string {
  switch (type) {
    case "special_offer":
      return "مشاهده پیشنهادهای شگفت‌انگیز";
    case "referral":
      return "مشاهده دعوت دوستان";
    case "coupon":
    case "coupon_expiry":
      return "مشاهده کدهای تخفیف من";
    case "order":
      return "مشاهده جزئیات سفارش";
    default:
      return "مشاهده";
  }
}
