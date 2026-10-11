import { describe, expect, it, vi } from "vitest";

const connectFn = vi.fn();
const svc = vi.fn();
vi.mock("@/lib/db/connect", () => ({ connectToDatabase: () => connectFn() }));
vi.mock("@/lib/wallet/process-topup-callback", () => ({ processTopupCallback: (a: unknown) => svc(a) }));
vi.mock("@/config/env", () => ({ env: { NEXT_PUBLIC_APP_URL: "https://shop.test" } }));

import { GET } from "@/app/api/v1/wallet/topup/callback/route";

const req = (qs: string) => ({ nextUrl: new URL(`https://shop.test/cb?${qs}`) }) as never;

describe("wallet topup callback route", () => {
  it("ignores Status/amount and passes only authority", async () => {
    connectFn.mockResolvedValue(undefined);
    svc.mockResolvedValue({ outcome: "pending", amount: 10 });
    const res = await GET(req("Authority=A123456789012&Status=OK&amount=99999"));
    expect(svc).toHaveBeenCalledWith({ authority: "A123456789012" });
    expect(res.headers.get("location")).toBe("https://shop.test/wallet/topup/result?status=pending&amount=10");
  });
  it("unconfirmed gateway code shows pending (under review), never failed, and leaks no code", async () => {
    connectFn.mockResolvedValue(undefined);
    svc.mockResolvedValue({ outcome: "pending", amount: 10, manualReview: true });
    const res = await GET(req("Authority=A123456789012&Status=NOK"));
    const loc = res.headers.get("location")!;
    expect(loc).toBe("https://shop.test/wallet/topup/result?status=pending&amount=10");
    expect(loc).not.toContain("failed");
    expect(loc).not.toContain("manualReview");
  });
  it("DB failure redirects to pending without leaking details", async () => {
    connectFn.mockReturnValueOnce(Promise.reject(new Error("mongodb://secret")));
    const res = await GET(req("Authority=A123456789012"));
    const loc = res.headers.get("location")!;
    expect(loc).toContain("status=pending");
    expect(loc).not.toContain("secret");
  });
});
