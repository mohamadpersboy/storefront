import { getZonedParts } from "./timezone";

/**
 * تاریخ‌های ادمین (انتخابگر تاریخ) با Time Zone کسب‌وکار تفسیر می‌شوند،
 * نه UTC:
 *  - شروع نمایش: ابتدای روز انتخاب‌شده (۰۰:۰۰ محلی)
 *  - پایان نمایش: انتهای همان روز (۲۳:۵۹:۵۹.۹۹۹ محلی)
 * ورودی تاریخ‌-فقط به‌صورت `YYYY-MM-DD` می‌آید؛ مقدار کامل (ISO با
 * زمان) دست‌نخورده می‌ماند.
 */
const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;

export function isDateOnly(value: string): boolean {
  return DATE_ONLY.test(value);
}

export function isValidDateOnly(value: string): boolean {
  const m = DATE_ONLY.exec(value);
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const probe = new Date(Date.UTC(y, mo - 1, d));
  return probe.getUTCFullYear() === y && probe.getUTCMonth() === mo - 1 && probe.getUTCDate() === d;
}

/** اختلاف (میلی‌ثانیه) ساعت محلی Time Zone با UTC در یک لحظه. */
function offsetMs(utcMs: number, timeZone: string): number {
  const whole = utcMs - (((utcMs % 1000) + 1000) % 1000);
  const p = getZonedParts(new Date(whole), timeZone);
  return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - whole;
}

/** لحظه UTC معادل یک زمان دیواری در Time Zone (DST-safe با یک بار اصلاح). */
export function zonedTimeToUtc(
  parts: { year: number; month: number; day: number; hour: number; minute: number; second: number; ms: number },
  timeZone: string,
): Date {
  const guess = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second, parts.ms);
  const first = offsetMs(guess, timeZone);
  let utc = guess - first;
  const second = offsetMs(utc, timeZone);
  if (second !== first) utc = guess - second;
  return new Date(utc);
}

export type DateEdge = "start" | "end";

export function dateOnlyToInstant(value: string, edge: DateEdge, timeZone: string): Date {
  const m = DATE_ONLY.exec(value);
  if (!m || !isValidDateOnly(value)) throw new Error(`Invalid date-only value: ${value}`);
  const [year, month, day] = [Number(m[1]), Number(m[2]), Number(m[3])];
  return edge === "start"
    ? zonedTimeToUtc({ year, month, day, hour: 0, minute: 0, second: 0, ms: 0 }, timeZone)
    : zonedTimeToUtc({ year, month, day, hour: 23, minute: 59, second: 59, ms: 999 }, timeZone);
}

export type AdminDateInput = string | Date | null | undefined;

/** `undefined` (ارسال‌نشده) و `null` (پاک‌کردن) را حفظ می‌کند. */
export function resolveAdminDate(
  value: AdminDateInput,
  edge: DateEdge,
  timeZone: string,
): Date | null | undefined {
  if (value === undefined || value === null) return value;
  if (value instanceof Date) return value;
  return isDateOnly(value) ? dateOnlyToInstant(value, edge, timeZone) : new Date(value);
}
