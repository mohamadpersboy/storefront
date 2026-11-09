import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/config/env", () => ({
  env: { SEPEHR_TERMINAL_ID: "99482044", SEPEHR_BASE_URL: undefined, NEXT_PUBLIC_APP_URL: "https://shop.example" },
}));

import { sepehrGateway } from "@/lib/payment/gateways/sepehr-gateway";

const fetchMock = vi.fn();
const json = (body: unknown, ok = true) => ({ ok, status: ok ? 200 : 500, json: async () => body });

const INVOICE = "a".repeat(32);
const RECEIPT = "824b3098-7035-4e61-ab09-51f07e22aebd";
const cb = (over: Record<string, string> = {}) => ({
  invoiceid: INVOICE,
  respcode: "0",
  amount: "50000", // 5000 تومان × ۱۰
  digitalreceipt: RECEIPT,
  terminalid: "99482044",
  rrn: "125014252007",
  cardnumber: "603769******0286",
  ...over,
});

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

describe("sepehr requestPayment", () => {
  it("sends Rial amount, own invoice id, callback URL and returns Pay URL", async () => {
    fetchMock.mockResolvedValue(json({ Status: 0, Accesstoken: "TOKEN123" }));
    const r = await sepehrGateway.requestPayment({
      amount: 5000,
      description: "x",
      callbackUrl: "https://shop.example/api/v1/payments/callback/sepehr",
      mobile: "09120000000",
    });
    const sent = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(fetchMock.mock.calls[0][0]).toBe("https://sepehr.shaparak.ir/Rest/V1/PeymentApi/GetToken");
    expect(sent).toMatchObject({ TerminalID: "99482044", Amount: "50000", payload: "" });
    expect(sent.InvoiceID).toMatch(/^[0-9a-f]{32}$/);
    expect(r).toMatchObject({ ok: true, gatewayToken: "TOKEN123", authority: sent.InvoiceID });
    if (r.ok) expect(r.paymentUrl).toBe("https://sepehr.shaparak.ir/Payment/Pay?token=TOKEN123&terminalId=99482044");
  });

  it("maps gateway error and network failure without leaking details", async () => {
    fetchMock.mockResolvedValueOnce(json({ Status: -5 }));
    expect(await sepehrGateway.requestPayment({ amount: 1, description: "", callbackUrl: "https://x" })).toMatchObject({
      ok: false,
      code: -5,
    });
    fetchMock.mockRejectedValueOnce(new Error("secret"));
    const r = await sepehrGateway.requestPayment({ amount: 1, description: "", callbackUrl: "https://x" });
    expect(r).toMatchObject({ ok: false, code: 0 });
    expect(JSON.stringify(r)).not.toContain("secret");
  });
});

describe("sepehr verifyPayment", () => {
  const verify = (data?: Record<string, string>) =>
    sepehrGateway.verifyPayment({ amount: 5000, authority: INVOICE, callbackData: data });

  it("success: Advice Ok with matching Rial amount", async () => {
    fetchMock.mockResolvedValue(json({ Status: "Ok", ReturnId: "50000" }));
    const r = await verify(cb());
    const sent = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(sent).toEqual({ digitalreceipt: RECEIPT, Tid: 99482044, InvoiceID: INVOICE });
    expect(r).toEqual({ success: true, refId: 125014252007, cardPan: "603769******0286", digitalReceipt: RECEIPT });
  });

  it("Duplicate Advice with matching amount is success (safe retry)", async () => {
    fetchMock.mockResolvedValue(json({ Status: "Duplicate", ReturnId: "50000" }));
    expect((await verify(cb())).success).toBe(true);
  });

  it("amount from Advice differs → unconfirmed, never success", async () => {
    fetchMock.mockResolvedValue(json({ Status: "Ok", ReturnId: "10000" }));
    expect(await verify(cb())).toMatchObject({ success: false, unconfirmed: true, retryable: false });
  });

  it("user cancel (respcode -1) is definitive failure and makes no network call", async () => {
    const r = await verify(cb({ respcode: "-1" }));
    expect(r).toMatchObject({ success: false, retryable: false, unconfirmed: false, code: -1 });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("forged/mismatching callback is ignored (retryable, no Advice)", async () => {
    for (const data of [
      cb({ invoiceid: "b".repeat(32) }),
      cb({ terminalid: "11111111" }),
      cb({ respcode: "abc" }),
      cb({ digitalreceipt: "x" }),
      cb({ amount: "1" }),
    ]) {
      expect(await verify(data)).toMatchObject({ success: false, retryable: true, unconfirmed: false });
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("no callback data (Cron) → retryable, no network call", async () => {
    expect(await verify(undefined)).toMatchObject({ success: false, retryable: true });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("Advice NOK -3 and network errors are retryable; other NOK codes need manual review", async () => {
    fetchMock.mockResolvedValueOnce(json({ Status: "NOk", ReturnId: "-3" }));
    expect(await verify(cb())).toMatchObject({ retryable: true, unconfirmed: false });
    fetchMock.mockRejectedValueOnce(new Error("down"));
    expect(await verify(cb())).toMatchObject({ retryable: true, unconfirmed: false });
    fetchMock.mockResolvedValueOnce(json({ Status: "NOk", ReturnId: "-7" }));
    expect(await verify(cb())).toMatchObject({ retryable: false, unconfirmed: true, code: -7 });
    fetchMock.mockResolvedValueOnce(json({ Status: "Error", ReturnId: "" }));
    expect(await verify(cb())).toMatchObject({ retryable: true, unconfirmed: false });
  });

  it("extractReceipt only accepts well-formed receipts", () => {
    expect(sepehrGateway.extractReceipt?.({ digitalreceipt: RECEIPT })).toBe(RECEIPT);
    expect(sepehrGateway.extractReceipt?.({ digitalreceipt: "a b" })).toBeNull();
    expect(sepehrGateway.extractReceipt?.(undefined)).toBeNull();
  });
});
