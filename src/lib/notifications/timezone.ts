export interface ZonedParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

/** اجزای تاریخ/ساعت یک لحظه در یک Time Zone مشخص (بدون وابستگی به TZ سرور). */
export function getZonedParts(date: Date, timeZone: string): ZonedParts {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour"),
    minute: get("minute"),
  };
}

/** `YYYY-MM-DD` روز محلی در Time Zone — برای `dedupeKey` روزانه. */
export function localDateKey(date: Date, timeZone: string): string {
  const p = getZonedParts(date, timeZone);
  return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
}

/** آیا ساعت محلی فعلی به (یا بعد از) ساعت/دقیقه هدف رسیده؟ */
export function hasReachedLocalTime(
  now: Date,
  timeZone: string,
  hour: number,
  minute: number,
): boolean {
  const p = getZonedParts(now, timeZone);
  return p.hour * 60 + p.minute >= hour * 60 + minute;
}
