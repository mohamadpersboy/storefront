import { describe, expect, it } from "vitest";
import { formatRelativeTime } from "./relative-time";

const now = new Date("2026-09-29T10:00:00Z");
const ago = (ms: number) => new Date(now.getTime() - ms).toISOString();

describe("formatRelativeTime", () => {
  it("formats recent times in Persian", () => {
    expect(formatRelativeTime(ago(10_000), now)).toBe("همین حالا");
    expect(formatRelativeTime(ago(5 * 60_000), now)).toBe("۵ دقیقه پیش");
    expect(formatRelativeTime(ago(2 * 3600_000), now)).toBe("۲ ساعت پیش");
    expect(formatRelativeTime(ago(3 * 86400_000), now)).toBe("۳ روز پیش");
  });
  it("falls back to a Jalali date after a week", () => {
    expect(formatRelativeTime(ago(30 * 86400_000), now)).toMatch(/^[۰-۹]{4}\/[۰-۹]{2}\/[۰-۹]{2}$/);
  });
});
