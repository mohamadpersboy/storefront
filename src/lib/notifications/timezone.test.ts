import { describe, expect, it } from "vitest";
import { DEFAULT_NOTIFICATION_CONFIG, resolveNotificationConfig } from "./config";
import { getZonedParts, hasReachedLocalTime, localDateKey } from "./timezone";

describe("timezone helpers (Asia/Tehran, UTC+3:30)", () => {
  it("converts a UTC instant to Tehran wall-clock parts", () => {
    expect(getZonedParts(new Date("2026-09-29T06:30:00Z"), "Asia/Tehran")).toMatchObject({
      year: 2026,
      month: 9,
      day: 29,
      hour: 10,
      minute: 0,
    });
  });

  it("date key follows the local day, not UTC", () => {
    // 21:00 UTC = 00:30 next day in Tehran
    expect(localDateKey(new Date("2026-09-29T21:00:00Z"), "Asia/Tehran")).toBe("2026-09-30");
    expect(localDateKey(new Date("2026-09-29T06:30:00Z"), "Asia/Tehran")).toBe("2026-09-29");
  });

  it("detects whether the scheduled local time was reached", () => {
    expect(hasReachedLocalTime(new Date("2026-09-29T06:29:00Z"), "Asia/Tehran", 10, 0)).toBe(false);
    expect(hasReachedLocalTime(new Date("2026-09-29T06:30:00Z"), "Asia/Tehran", 10, 0)).toBe(true);
    expect(hasReachedLocalTime(new Date("2026-09-29T09:00:00Z"), "Asia/Tehran", 10, 0)).toBe(true);
  });
});

describe("resolveNotificationConfig", () => {
  it("defaults to 10:00 Asia/Tehran and 24h", () => {
    expect(resolveNotificationConfig()).toEqual(DEFAULT_NOTIFICATION_CONFIG);
    expect(DEFAULT_NOTIFICATION_CONFIG).toMatchObject({
      timeZone: "Asia/Tehran",
      specialOfferHour: 10,
      specialOfferMinute: 0,
      couponExpiryReminderHours: 24,
    });
  });

  it("accepts valid overrides and falls back on invalid ones", () => {
    expect(
      resolveNotificationConfig({
        timeZone: "Europe/Berlin",
        specialOfferHour: 8,
        specialOfferMinute: 15,
        couponExpiryReminderHours: 48,
      }),
    ).toEqual({
      timeZone: "Europe/Berlin",
      specialOfferHour: 8,
      specialOfferMinute: 15,
      couponExpiryReminderHours: 48,
    });
    expect(
      resolveNotificationConfig({
        timeZone: "Not/AZone",
        specialOfferHour: 99,
        specialOfferMinute: -1,
        couponExpiryReminderHours: 0,
      }),
    ).toEqual(DEFAULT_NOTIFICATION_CONFIG);
  });
});
