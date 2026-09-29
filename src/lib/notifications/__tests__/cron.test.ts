import { beforeEach, describe, expect, it, vi } from "vitest";

const envMock = vi.hoisted(() => ({ CRON_SECRET: undefined as string | undefined }));
const run = vi.fn();

vi.mock("@/config/env", () => ({
  env: new Proxy(envMock, { get: (t, k) => (k in t ? t[k as keyof typeof t] : undefined) }),
}));
vi.mock("@/lib/db/connect", () => ({ connectToDatabase: vi.fn() }));
vi.mock("@/lib/notifications/runtime-config", () => ({
  getNotificationConfig: () => ({ timeZone: "Asia/Tehran" }),
}));
vi.mock("@/lib/notifications/scheduled", () => ({
  runScheduledNotifications: (...a: unknown[]) => run(...a),
}));

import { GET } from "@/app/api/v1/cron/notifications/route";

const SECRET = "s".repeat(24);
const call = (auth?: string) =>
  GET(new Request("http://localhost/api/v1/cron/notifications", { headers: auth ? { authorization: auth } : {} }));

beforeEach(() => {
  run.mockReset();
  envMock.CRON_SECRET = SECRET;
});

describe("cron route", () => {
  it("is disabled (503) when CRON_SECRET is not configured", async () => {
    envMock.CRON_SECRET = undefined;
    expect((await call(`Bearer ${SECRET}`)).status).toBe(503);
    expect(run).not.toHaveBeenCalled();
  });

  it("rejects missing or wrong Authorization with 401", async () => {
    expect((await call()).status).toBe(401);
    expect((await call("Bearer wrong")).status).toBe(401);
    expect((await call(SECRET)).status).toBe(401);
    expect(run).not.toHaveBeenCalled();
  });

  it("runs the scheduled service (orchestration only) with a valid secret", async () => {
    run.mockResolvedValue({ specialOffer: { status: "not_due" }, couponExpiry: { coupons: 0, created: 0 } });
    const res = await call(`Bearer ${SECRET}`);
    expect(res.status).toBe(200);
    expect(run).toHaveBeenCalledTimes(1);
    expect((await res.json()).data.specialOffer.status).toBe("not_due");
  });
});
