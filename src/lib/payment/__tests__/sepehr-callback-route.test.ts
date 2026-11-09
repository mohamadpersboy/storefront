import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const processFn = vi.fn();
const topupFn = vi.fn();
const connectFn = vi.fn();
vi.mock("@/config/env", () => ({ env: { NEXT_PUBLIC_APP_URL: "https://shop.example" } }));
vi.mock("@/lib/db/connect", () => ({ connectToDatabase: (...a: unknown[]) => connectFn(...a) }));
vi.mock("@/lib/payment/process-gateway-callback", () => ({ processGatewayCallback: (...a: unknown[]) => processFn(...a) }));
vi.mock("@/lib/wallet/process-topup-callback", () => ({ processTopupCallback: (...a: unknown[]) => topupFn(...a) }));

import { POST, GET } from "@/app/api/v1/payments/callback/sepehr/route";
import { POST as TOPUP_POST } from "@/app/api/v1/wallet/topup/callback/sepehr/route";

const form = (data: Record<string, string>, path = "payments/callback/sepehr") =>
  new NextRequest(`https://shop.example/api/v1/${path}`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(data).toString(),
  });
const loc = (r: Response) => new URL(r.headers.get("location")!);

beforeEach(() => {
  processFn.mockReset();
  topupFn.mockReset();
  connectFn.mockReset();
  connectFn.mockResolvedValue(undefined);
});

describe("Sepehr order callback route", () => {
  it("POST form → service gets invoiceid + raw data, 303 redirect to result page", async () => {
    processFn.mockResolvedValue({ outcome: "success", orderNumber: 9, amount: 5000 });
    const r = await POST(form({ InvoiceID: "inv1234567", RespCode: "0", digitalreceipt: "rcpt-1234567" }));
    expect(r.status).toBe(303);
    expect(processFn).toHaveBeenCalledWith({
      authority: "inv1234567",
      gateway: "sepehr",
      callbackData: { invoiceid: "inv1234567", respcode: "0", digitalreceipt: "rcpt-1234567" },
    });
    expect(loc(r).pathname).toBe("/payment/result");
    expect(loc(r).searchParams.get("status")).toBe("success");
  });

  it("GET (getMethod=1) works the same", async () => {
    processFn.mockResolvedValue({ outcome: "failed" });
    const r = await GET(new NextRequest("https://shop.example/api/v1/payments/callback/sepehr?invoiceid=inv1234567&respcode=-1"));
    expect(loc(r).searchParams.get("status")).toBe("failed");
  });

  it("missing invoiceid → service called with null authority", async () => {
    processFn.mockResolvedValue({ outcome: "error" });
    await POST(form({ respcode: "0" }));
    expect(processFn.mock.calls[0][0].authority).toBeNull();
  });

  it("failure → pending redirect without leaking details", async () => {
    processFn.mockRejectedValue(new Error("db secret"));
    const r = await POST(form({ invoiceid: "inv1234567" }));
    expect(loc(r).searchParams.get("status")).toBe("pending");
    expect(r.headers.get("location")).not.toContain("secret");
  });
});

describe("Sepehr wallet top-up callback route", () => {
  it("passes sepehr gateway and redirects to top-up result", async () => {
    topupFn.mockResolvedValue({ outcome: "success", amount: 5000 });
    const r = await TOPUP_POST(form({ invoiceid: "inv1234567", respcode: "0" }, "wallet/topup/callback/sepehr"));
    expect(topupFn.mock.calls[0][0]).toMatchObject({ authority: "inv1234567", gateway: "sepehr" });
    expect(loc(r).pathname).toBe("/wallet/topup/result");
    expect(loc(r).searchParams.get("amount")).toBe("5000");
  });
});
