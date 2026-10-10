import { beforeEach, describe, expect, it, vi } from "vitest";

const { reconcile, envMock } = vi.hoisted(() => ({
  reconcile: vi.fn(),
  envMock: {} as { CRON_SECRET?: string },
}));
vi.mock("@/config/env", () => ({ env: envMock }));
vi.mock("@/lib/db/connect", () => ({ connectToDatabase: vi.fn(async () => {}) }));
vi.mock("@/lib/wallet/reconcile-topups", () => ({ reconcileTopups: () => reconcile() }));

import { GET } from "@/app/api/v1/cron/topup-reconcile/route";

const req = (auth?: string) =>
  new Request("http://x/api/v1/cron/topup-reconcile", { headers: auth ? { authorization: auth } : {} });

beforeEach(() => {
  reconcile.mockReset();
  reconcile.mockResolvedValue({ scanned: 0 });
  envMock.CRON_SECRET = "s".repeat(20);
});

describe("topup-reconcile cron auth", () => {
  it("returns 503 without CRON_SECRET and does not run", async () => {
    envMock.CRON_SECRET = undefined;
    expect((await GET(req("Bearer x"))).status).toBe(503);
    expect(reconcile).not.toHaveBeenCalled();
  });
  it("returns 401 without or with wrong header", async () => {
    expect((await GET(req())).status).toBe(401);
    expect((await GET(req("Bearer wrong"))).status).toBe(401);
    expect(reconcile).not.toHaveBeenCalled();
  });
  it("runs with correct secret", async () => {
    expect((await GET(req(`Bearer ${"s".repeat(20)}`))).status).toBe(200);
    expect(reconcile).toHaveBeenCalledTimes(1);
  });
});
