import { afterEach, describe, expect, it, vi } from "vitest";
import { isRetryableVerifyCode, verifyZarinpalPayment } from "@/lib/payment/zarinpal";

const mockFetch = (status: number, body: unknown) =>
  vi.stubGlobal("fetch", vi.fn(async () => ({ ok: status < 400, status, json: async () => body })));

afterEach(() => vi.unstubAllGlobals());

describe("Zarinpal verify classification", () => {
  it("treats only -50/-51/-53/-54 as definitive failures", () => {
    for (const c of [-50, -51, -53, -54]) expect(isRetryableVerifyCode(c)).toBe(false);
    for (const c of [0, -52, -9, -10, -11, -12, 500, 999]) expect(isRetryableVerifyCode(c)).toBe(true);
  });

  it("101 (already verified) is success", async () => {
    mockFetch(200, { data: { code: 101, ref_id: 5, card_pan: "1" } });
    expect(await verifyZarinpalPayment({ amount: 1000, authority: "A" })).toMatchObject({ success: true, refId: 5 });
  });

  it("network error is retryable", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("net"); }));
    expect(await verifyZarinpalPayment({ amount: 1000, authority: "A" })).toMatchObject({ success: false, retryable: true });
  });

  it("HTTP 500 without code is retryable; -53 is definitive", async () => {
    mockFetch(500, {});
    expect(await verifyZarinpalPayment({ amount: 1, authority: "A" })).toMatchObject({ retryable: true });
    mockFetch(200, { errors: { code: -53, message: "m" } });
    expect(await verifyZarinpalPayment({ amount: 1, authority: "A" })).toMatchObject({ retryable: false, code: -53 });
  });
});
