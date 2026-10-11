import { afterEach, describe, expect, it, vi } from "vitest";
import { isRetryableVerifyCode, verifyZarinpalPayment, VERIFY_TIMEOUT_MS } from "@/lib/payment/zarinpal";

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

  it("verify request carries an AbortSignal timeout", async () => {
    const f = vi.fn(async (_url: string, init: RequestInit) => {
      expect(init.signal).toBeInstanceOf(AbortSignal);
      expect(init.signal!.aborted).toBe(false);
      return { ok: true, status: 200, json: async () => ({ data: { code: 100, ref_id: 1, card_pan: null } }) };
    });
    vi.stubGlobal("fetch", f);
    await verifyZarinpalPayment({ amount: 1, authority: "A" });
    expect(f).toHaveBeenCalledTimes(1);
    expect(VERIFY_TIMEOUT_MS).toBeGreaterThan(0);
    expect(VERIFY_TIMEOUT_MS).toBeLessThanOrEqual(10_000);
  });

  it("timeout is an uncertain, retryable result (never success, never definitive failure)", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => {
      throw new DOMException("The operation was aborted due to timeout", "TimeoutError");
    }));
    const r = await verifyZarinpalPayment({ amount: 1, authority: "A" });
    expect(r).toMatchObject({ success: false, code: 0, retryable: true });
  });

  it("a stalled fetch is really stopped by the signal", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("fetch", vi.fn((_u: string, init: RequestInit) =>
      new Promise((_res, rej) => {
        init.signal!.addEventListener("abort", () => rej(new DOMException("timeout", "TimeoutError")));
        setTimeout(() => (init.signal as unknown as { dispatchEvent(e: Event): void }).dispatchEvent(new Event("abort")), VERIFY_TIMEOUT_MS);
      })));
    const p = verifyZarinpalPayment({ amount: 1, authority: "A" });
    await vi.advanceTimersByTimeAsync(VERIFY_TIMEOUT_MS + 1);
    expect(await p).toMatchObject({ success: false, retryable: true });
    vi.useRealTimers();
  });
});
