import { beforeEach, describe, expect, it, vi } from "vitest";

const startFn = vi.fn();
vi.mock("@/lib/db/connect", () => ({ connectToDatabase: vi.fn().mockResolvedValue(undefined) }));
vi.mock("@/lib/payment/initiate-order-payment", () => ({
  PaymentInitiationError: class PaymentInitiationError extends Error {
    status = 502;
  },
}));
vi.mock("@/lib/payment/payment-links", async () => {
  class PaymentLinkError extends Error {
    status: number;
    constructor(message: string, status = 400) {
      super(message);
      this.status = status;
    }
  }
  return {
    PaymentLinkError,
    isPaymentLinkToken: (v: unknown) => typeof v === "string" && /^[A-Za-z0-9_-]{32}$/.test(v),
    startPaymentFromLink: (...a: unknown[]) => startFn(...a),
  };
});

import { POST } from "@/app/api/v1/pay/[token]/start/route";
import { PaymentLinkError } from "@/lib/payment/payment-links";

const TOKEN = "A".repeat(32);
const call = (token: string) => POST(new Request("http://localhost/x", { method: "POST" }), { params: Promise.resolve({ token }) });

beforeEach(() => startFn.mockReset());

describe("POST /api/v1/pay/[token]/start", () => {
  it("returns the gateway URL for a valid link", async () => {
    startFn.mockResolvedValue({ paymentUrl: "https://gateway/pay" });
    const r = await call(TOKEN);
    expect(r.status).toBe(200);
    expect((await r.json()).data).toEqual({ paymentUrl: "https://gateway/pay" });
    expect(startFn).toHaveBeenCalledWith(TOKEN);
  });

  it("rejects malformed tokens with 404 before any lookup", async () => {
    expect((await call("short")).status).toBe(404);
    expect(startFn).not.toHaveBeenCalled();
  });

  it("maps link errors and hides unexpected failures", async () => {
    startFn.mockRejectedValueOnce(new PaymentLinkError("منقضی", 404));
    expect((await call(TOKEN)).status).toBe(404);
    startFn.mockRejectedValueOnce(new Error("mongo secret-uri"));
    const r = await call(TOKEN);
    expect(r.status).toBe(500);
    expect(JSON.stringify(await r.json())).not.toContain("secret");
  });
});
