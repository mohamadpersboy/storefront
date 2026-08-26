import { describe, it, expect } from "vitest";
import { isoToJalali, jalaliToIso, formatJalali, jalaliMonthLength } from "@/lib/utils/jalali";

describe("isoToJalali / jalaliToIso round trip", () => {
  it("converts a known Gregorian date to the correct Jalali date", () => {
    // 2016-04-11 is well documented as 1395/01/23 (Nowruz + 22 days)
    expect(isoToJalali("2016-04-11T00:00:00.000Z")).toEqual({ jy: 1395, jm: 1, jd: 23 });
  });

  it("round-trips a Jalali date back to the same Jalali date through ISO", () => {
    const iso = jalaliToIso({ jy: 1403, jm: 6, jd: 15 });
    expect(isoToJalali(iso)).toEqual({ jy: 1403, jm: 6, jd: 15 });
  });

  it("anchors to UTC midnight so the calendar day never shifts by timezone", () => {
    const iso = jalaliToIso({ jy: 1403, jm: 1, jd: 1 });
    expect(iso.endsWith("T00:00:00.000Z")).toBe(true);
  });
});

describe("formatJalali", () => {
  it("formats with Persian digits and zero-padded month/day", () => {
    const iso = jalaliToIso({ jy: 1403, jm: 1, jd: 5 });
    expect(formatJalali(iso)).toBe("۱۴۰۳/۰۱/۰۵");
  });
});

describe("jalaliMonthLength", () => {
  it("returns 31 for the first 6 months", () => {
    expect(jalaliMonthLength(1403, 1)).toBe(31);
  });

  it("returns 30 for months 7-11", () => {
    expect(jalaliMonthLength(1403, 8)).toBe(30);
  });

  it("returns 29 or 30 for Esfand depending on leap year", () => {
    expect(jalaliMonthLength(1403, 12)).toBe(30); // 1403 is a leap year
    expect(jalaliMonthLength(1404, 12)).toBe(29);
  });
});
