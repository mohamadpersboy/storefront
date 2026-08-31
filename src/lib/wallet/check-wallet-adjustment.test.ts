import { describe, expect, it } from "vitest";
import { checkWalletAdjustment } from "./check-wallet-adjustment";

describe("checkWalletAdjustment", () => {
  it("allows a credit of any positive amount", () => {
    const result = checkWalletAdjustment(100_000, "credit", 50_000);
    expect(result.ok).toBe(true);
    expect(result.newBalance).toBe(150_000);
  });

  it("allows a debit exactly equal to the current balance", () => {
    const result = checkWalletAdjustment(100_000, "debit", 100_000);
    expect(result.ok).toBe(true);
    expect(result.newBalance).toBe(0);
  });

  it("rejects a debit larger than the current balance", () => {
    const result = checkWalletAdjustment(50_000, "debit", 100_000);
    expect(result.ok).toBe(false);
    expect(result.newBalance).toBe(50_000);
  });

  it("rejects a zero amount", () => {
    const result = checkWalletAdjustment(100_000, "credit", 0);
    expect(result.ok).toBe(false);
  });

  it("rejects a negative amount", () => {
    const result = checkWalletAdjustment(100_000, "credit", -10);
    expect(result.ok).toBe(false);
  });

  it("allows a debit from a zero balance only if amount is also zero-blocked (i.e. always rejected)", () => {
    const result = checkWalletAdjustment(0, "debit", 1);
    expect(result.ok).toBe(false);
  });
});
