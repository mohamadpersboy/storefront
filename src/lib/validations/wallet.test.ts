import { describe, expect, it } from "vitest";
import { adjustWalletSchema } from "./wallet";

describe("adjustWalletSchema", () => {
  it("accepts a valid credit payload", () => {
    const result = adjustWalletSchema.safeParse({
      type: "credit",
      amount: 100_000,
      reason: "جبران تأخیر ارسال",
    });
    expect(result.success).toBe(true);
  });

  it("accepts a valid debit payload", () => {
    const result = adjustWalletSchema.safeParse({
      type: "debit",
      amount: 50_000,
      reason: "اصلاح خطای واریز قبلی",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid type", () => {
    const result = adjustWalletSchema.safeParse({
      type: "refund",
      amount: 10_000,
      reason: "test",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a zero amount", () => {
    const result = adjustWalletSchema.safeParse({ type: "credit", amount: 0, reason: "test" });
    expect(result.success).toBe(false);
  });

  it("rejects a negative amount", () => {
    const result = adjustWalletSchema.safeParse({ type: "credit", amount: -100, reason: "test" });
    expect(result.success).toBe(false);
  });

  it("rejects a non-integer amount", () => {
    const result = adjustWalletSchema.safeParse({
      type: "credit",
      amount: 100.5,
      reason: "test",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a too-short reason", () => {
    const result = adjustWalletSchema.safeParse({ type: "credit", amount: 1000, reason: "ok" });
    expect(result.success).toBe(false);
  });

  it("rejects a missing reason", () => {
    const result = adjustWalletSchema.safeParse({ type: "credit", amount: 1000 });
    expect(result.success).toBe(false);
  });
});
