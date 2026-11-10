import { describe, expect, it, vi } from "vitest";

vi.mock("@/config/env", () => ({
  env: { SEPEHR_TERMINAL_ID: "99482044", SEPEHR_BASE_URL: undefined, SEPEHR_PAY_URL: undefined, NEXT_PUBLIC_APP_URL: "https://shop.example" },
}));

import { GET } from "@/app/api/v1/payments/redirect/sepehr/route";
import { NextRequest } from "next/server";

const call = (qs: string) => GET(new NextRequest(`https://shop.example/api/v1/payments/redirect/sepehr${qs}`));

describe("sepehr redirect route", () => {
  it("returns an auto-submitting POST form to the bank with terminal id and token", async () => {
    const res = await call("?token=ABC123def456");
    const html = await res.text();
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("no-store");
    expect(html).toContain('action="https://mabna.shaparak.ir:8080/pay"');
    expect(html).toContain('method="POST"');
    expect(html).toContain('name="TerminalID" value="99482044"');
    expect(html).toContain('name="token" value="ABC123def456"');
  });

  it("rejects missing or malformed tokens (no HTML injection)", async () => {
    expect((await call("")).status).toBe(400);
    expect((await call("?token=" + encodeURIComponent('"><script>alert(1)</script>'))).status).toBe(400);
  });
});
