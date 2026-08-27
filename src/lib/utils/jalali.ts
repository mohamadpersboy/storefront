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

export interface JalaaliDateTimeParts extends JalaaliDateParts {
  hh: number;
  mm: number;
}

/**
 * Time-aware variant for fields like Amazing Offer's start/end that
 * need hour:minute precision. Unlike isoToJalali/jalaliToIso (which
 * anchor to UTC midnight for pure calendar dates), this reads and
 * writes the browser's *local* wall-clock time — matching how the
 * previous `datetime-local` input behaved, so swapping the widget
 * doesn't change what moment in time a given "day 5, 14:30" means.
 */
export function isoToJalaliDateTime(iso: string): JalaaliDateTimeParts {
  const date = new Date(iso);
  const { jy, jm, jd } = toJalaali(date.getFullYear(), date.getMonth() + 1, date.getDate());
  return { jy, jm, jd, hh: date.getHours(), mm: date.getMinutes() };
}

export function jalaliDateTimeToIso(parts: JalaaliDateTimeParts): string {
  const { gy, gm, gd } = toGregorian(parts.jy, parts.jm, parts.jd);
  return new Date(gy, gm - 1, gd, parts.hh, parts.mm).toISOString();
}
