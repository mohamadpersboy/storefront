import { toJalaali, toGregorian, jalaaliMonthLength as _jalaaliMonthLength } from "jalaali-js";
import { toPersianDigits } from "@/lib/utils/format";

export const PERSIAN_MONTH_NAMES = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
];

export interface JalaaliDateParts {
  jy: number;
  jm: number;
  jd: number;
}

/** UTC-safe: reads the calendar date as it should appear to the user,
 * independent of the server/browser's local timezone offset. */
export function isoToJalali(iso: string): JalaaliDateParts {
  const date = new Date(iso);
  return toJalaali(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
}

/** Produces a date-only ISO string (midnight UTC) from Jalali parts —
 * dates in this project (Coupon start/expiry) never carry a meaningful
 * time-of-day, so anchoring to UTC midnight avoids off-by-one-day bugs
 * from local-timezone conversion. */
export function jalaliToIso(parts: JalaaliDateParts): string {
  const { gy, gm, gd } = toGregorian(parts.jy, parts.jm, parts.jd);
  return new Date(Date.UTC(gy, gm - 1, gd)).toISOString();
}

export function formatJalali(iso: string): string {
  const { jy, jm, jd } = isoToJalali(iso);
  return toPersianDigits(`${jy}/${String(jm).padStart(2, "0")}/${String(jd).padStart(2, "0")}`);
}

export function todayJalali(): JalaaliDateParts {
  const now = new Date();
  return toJalaali(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

export function jalaliMonthLength(jy: number, jm: number): number {
  return _jalaaliMonthLength(jy, jm);
}
