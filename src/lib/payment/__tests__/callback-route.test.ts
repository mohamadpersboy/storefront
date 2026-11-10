import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const processFn = vi.fn();
const connectFn = vi.fn();
vi.mock("@/lib/db/connect", () => ({ connectToDatabase: (...a: unknown[]) => connectFn(...a) }));
const returnPathFn = vi.fn();
vi.mock("@/lib/payment/payment-links", () => ({ getPaymentLinkReturnPath: (...a: unknown[]) => returnPathFn(...a) }));
vi.mock("@/lib/payment/process-gateway-callback", () => ({ processGatewayCallback: (...a: unknown[]) => processFn(...a) }));

import { GET } from "@/app/api/v1/payments/callback/route";

const call = (qs: string) => GET(new NextRequest(`http://localhost/api/v1/payments/callback?${qs}`));
const loc = (r: Response) => new URL(r.headers.get("location")!);

beforeEach(() => {
  processFn.mockReset();
  returnPathFn.mockReset();
  returnPathFn.mockResolvedValue(null);
  connectFn.mockReset();
  connectFn.mockResolvedValue(undefined);
});

describe("GET /api/v1/payments/callback", () => {
  it("ignores client Status/amount: only Authority reaches the service", async () => {
    processFn.mockResolvedValue({ outcome: "success", orderNumber: 7, amount: 5000 });
    const r = await call("Authority=A123&Status=NOK&amount=1");
    expect(processFn).toHaveBeenCalledWith({ authority: "A123" });
    const u = loc(r);
    expect(u.searchParams.get("status")).toBe("success");
    expect(u.searchParams.get("amount")).toBe("5000");
  });

  it("payment started from a pay link returns to /pay/<token>", async () => {
    processFn.mockResolvedValue({ outcome: "failed" });
    returnPathFn.mockResolvedValue("/pay/" + "T".repeat(32));
    const u = loc(await call("Authority=A123"));
    expect(returnPathFn).toHaveBeenCalledWith("A123");
    expect(u.pathname).toBe("/pay/" + "T".repeat(32));
    expect(u.searchParams.get("status")).toBe("failed");
  });

  it("maps pending/failed/error outcomes to the result page", async () => {
    for (const o of ["pending", "failed", "error"]) {
      processFn.mockResolvedValue({ outcome: o });
      expect(loc(await call("Authority=A")).searchParams.get("status")).toBe(o);
    }
  });

  it("DB failure → pending redirect, service never called, no leaked details", async () => {
    connectFn.mockResolvedValueOnce(undefined); // مقدار اولیه برای تست‌های بعد
    connectFn.mockReset();
    connectFn.mockReturnValueOnce(Promise.reject(new Error("db down secret-token")));
    const r = await call("Authority=A");
    expect(loc(r).searchParams.get("status")).toBe("pending");
    expect(r.headers.get("location")).not.toContain("secret");
    expect(processFn).not.toHaveBeenCalled();
  });
});
