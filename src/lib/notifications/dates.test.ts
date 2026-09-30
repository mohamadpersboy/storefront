import { describe, expect, it } from "vitest";
import { dateOnlyToInstant, isValidDateOnly, resolveAdminDate, zonedTimeToUtc } from "./dates";

const TEHRAN = "Asia/Tehran";

describe("admin dates are interpreted in the business time zone (Asia/Tehran, UTC+3:30)", () => {
  it("start of day = 00:00 Tehran = 20:30 UTC of the previous day", () => {
    expect(dateOnlyToInstant("2026-10-02", "start", TEHRAN).toISOString()).toBe("2026-10-01T20:30:00.000Z");
  });

  it("end of day = 23:59:59.999 Tehran = 20:29:59.999 UTC of the same day", () => {
    expect(dateOnlyToInstant("2026-10-02", "end", TEHRAN).toISOString()).toBe("2026-10-02T20:29:59.999Z");
  });

  it("1405/07/10 (2026-10-02) stays valid through the whole Tehran day, not until 00:00 UTC", () => {
    const expiry = dateOnlyToInstant("2026-10-02", "end", TEHRAN);
    expect(expiry > new Date("2026-10-02T19:00:00Z")).toBe(true); // 22:30 Tehran, same day
    expect(expiry < new Date("2026-10-02T20:30:00Z")).toBe(true); // 00:00 Tehran next day
    expect(expiry > new Date("2026-10-02T00:00:00Z")).toBe(true); // the old buggy expiry point
  });

  it("works for other zones and is DST-safe", () => {
    expect(dateOnlyToInstant("2026-01-15", "start", "UTC").toISOString()).toBe("2026-01-15T00:00:00.000Z");
    expect(dateOnlyToInstant("2026-01-15", "start", "Europe/Berlin").toISOString()).toBe("2026-01-14T23:00:00.000Z");
    expect(dateOnlyToInstant("2026-07-15", "start", "Europe/Berlin").toISOString()).toBe("2026-07-14T22:00:00.000Z");
  });

  it("zonedTimeToUtc converts wall-clock time", () => {
    expect(
      zonedTimeToUtc({ year: 2026, month: 9, day: 29, hour: 10, minute: 0, second: 0, ms: 0 }, TEHRAN).toISOString(),
    ).toBe("2026-09-29T06:30:00.000Z");
  });

  it("validates calendar dates", () => {
    expect(isValidDateOnly("2026-02-28")).toBe(true);
    expect(isValidDateOnly("2026-02-31")).toBe(false);
    expect(isValidDateOnly("2026-13-01")).toBe(false);
    expect(isValidDateOnly("26-1-1")).toBe(false);
  });

  it("resolveAdminDate keeps undefined/null and leaves full timestamps untouched", () => {
    expect(resolveAdminDate(undefined, "start", TEHRAN)).toBeUndefined();
    expect(resolveAdminDate(null, "end", TEHRAN)).toBeNull();
    const full = new Date("2026-10-02T05:12:00Z");
    expect(resolveAdminDate(full, "end", TEHRAN)).toBe(full);
    expect(resolveAdminDate("2026-10-02T05:12:00Z", "end", TEHRAN)?.toISOString()).toBe("2026-10-02T05:12:00.000Z");
  });
});
