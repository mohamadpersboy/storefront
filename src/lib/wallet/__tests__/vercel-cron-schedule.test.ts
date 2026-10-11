import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const cfg = JSON.parse(readFileSync(join(process.cwd(), "vercel.json"), "utf8")) as {
  crons: { path: string; schedule: string }[];
};

// Hobby: only crons that run at most once per day are accepted (official Vercel docs).
// Minute and hour must be fixed numbers; wildcard, step, list and range forms in these
// two fields run more than once per day. Run timing is also not guaranteed (up to ~59 min late).
function runsAtMostOncePerDay(schedule: string): boolean {
  const [minute, hour] = schedule.trim().split(/\s+/);
  return /^\d+$/.test(minute) && /^\d+$/.test(hour);
}

describe("vercel.json cron schedules", () => {
  it("topup-reconcile is daily (Hobby-compatible)", () => {
    const c = cfg.crons.find((x) => x.path === "/api/v1/cron/topup-reconcile");
    expect(c?.schedule).toBe("0 3 * * *");
    expect(runsAtMostOncePerDay(c!.schedule)).toBe(true);
  });

  it("every cron entry runs at most once per day", () => {
    for (const c of cfg.crons) expect(runsAtMostOncePerDay(c.schedule), c.path + " " + c.schedule).toBe(true);
  });

  it("notification cron schedules are unchanged", () => {
    const n = cfg.crons.filter((x) => x.path === "/api/v1/cron/notifications").map((x) => x.schedule);
    expect(n).toEqual(["30 6 * * *", "30 7 * * *"]);
  });
});
