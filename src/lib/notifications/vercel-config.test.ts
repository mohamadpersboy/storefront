import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { DEFAULT_NOTIFICATION_CONFIG } from "./config";

/**
 * Guard برای Schedule: Vercel Cron فقط UTC است و در Hobby دقتش ساعتی
 * (±۵۹ دقیقه). دو Slot در یک روز (یک ساعت اختلاف) تضمین می‌کنند اگر Slot
 * اول قبل از ۱۰:۰۰ تهران اجرا شد، Slot دوم همان روز اعلان را بسازد.
 */
describe("vercel.json notification cron", () => {
  const config = JSON.parse(readFileSync(join(process.cwd(), "vercel.json"), "utf8")) as {
    crons: { path: string; schedule: string }[];
  };
  const jobs = config.crons.filter((c) => c.path === "/api/v1/cron/notifications");
  const targetUtcMinutes =
    DEFAULT_NOTIFICATION_CONFIG.specialOfferHour * 60 + DEFAULT_NOTIFICATION_CONFIG.specialOfferMinute - 210; // Tehran = UTC+3:30

  it("has two daily slots on the notifications route", () => {
    expect(jobs).toHaveLength(2);
    for (const job of jobs) expect(job.schedule).toMatch(/^\d{1,2} \d{1,2} \* \* \*$/); // once per day (Hobby-valid)
  });

  it("first slot is at the target time (06:30 UTC = 10:00 Tehran) and the last is an hour later", () => {
    const minutes = jobs
      .map((j) => {
        const [m, h] = j.schedule.split(" ").map(Number);
        return h * 60 + m;
      })
      .sort((a, b) => a - b);
    expect(minutes[0]).toBe(targetUtcMinutes);
    expect(minutes[1] - minutes[0]).toBe(60);
  });
});
