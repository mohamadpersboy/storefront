import { describe, expect, it } from "vitest";
import {
  chatDayKey,
  formatChatClock,
  formatChatDayLabel,
  notificationLinkLabel,
} from "./chat-format";

// ۱۲:۳۰ UTC = ۱۶:۰۰ تهران (UTC+3:30، بدون DST).
const NOW = new Date("2026-11-01T12:30:00.000Z");

describe("chat-format", () => {
  it("formats the clock in the business time zone with Persian digits", () => {
    expect(formatChatClock("2026-11-01T11:32:00.000Z")).toBe("۱۵:۰۲");
  });

  it("groups by the local day, not the UTC day", () => {
    // ۲۱:۰۰ UTC روز ۱ ← ۰۰:۳۰ تهران روز ۲
    expect(chatDayKey("2026-11-01T21:00:00.000Z")).toBe("2026-11-02");
    expect(chatDayKey("2026-11-01T11:00:00.000Z")).toBe("2026-11-01");
  });

  it("labels today and yesterday", () => {
    expect(formatChatDayLabel("2026-11-01T08:00:00.000Z", NOW)).toBe("امروز");
    expect(formatChatDayLabel("2026-10-31T08:00:00.000Z", NOW)).toBe("دیروز");
  });

  it("labels older days with a Persian date and adds the year only when it differs", () => {
    const sameYear = formatChatDayLabel("2026-10-20T08:00:00.000Z", NOW);
    expect(sameYear).toMatch(/مهر|آبان/);
    expect(sameYear).not.toMatch(/۱۴\d\d/);

    const otherYear = formatChatDayLabel("2025-03-01T08:00:00.000Z", NOW);
    expect(otherYear).toMatch(/۱۴۰۳|۱۴۰۴/);
  });

  it("picks a link label per notification type", () => {
    expect(notificationLinkLabel("order")).toBe("مشاهده جزئیات سفارش");
    expect(notificationLinkLabel("coupon")).toBe("مشاهده کدهای تخفیف من");
    expect(notificationLinkLabel("announcement")).toBe("مشاهده");
  });
});
