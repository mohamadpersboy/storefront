import { describe, expect, it } from "vitest";
import { adjustWalletSchema, topupWalletSchema, createWithdrawalRequestSchema, reviewWithdrawalRequestSchema } from "./wallet";

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

describe("topupWalletSchema", () => {
  it("accepts a valid amount", () => {
    const result = topupWalletSchema.safeParse({ amount: 100_000 });
    expect(result.success).toBe(true);
  });

  it("rejects an amount below the minimum", () => {
    const result = topupWalletSchema.safeParse({ amount: 5_000 });
    expect(result.success).toBe(false);
  });

  it("rejects an amount above the maximum", () => {
    const result = topupWalletSchema.safeParse({ amount: 1_000_000_000 });
    expect(result.success).toBe(false);
  });
});

describe("createWithdrawalRequestSchema", () => {
  it("accepts a valid request with a card number", () => {
    const result = createWithdrawalRequestSchema.safeParse({
      amount: 100_000,
      ownerName: "علی رضایی",
      cardNumber: "6037991234567890",
    });
    expect(result.success).toBe(true);
  });

  it("accepts a valid request with an IBAN (24 digits after IR)", () => {
    const result = createWithdrawalRequestSchema.safeParse({
      amount: 100_000,
      ownerName: "علی رضایی",
      iban: "IR123456789012345678901234",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an IBAN with the wrong digit count", () => {
    const result = createWithdrawalRequestSchema.safeParse({
      amount: 100_000,
      ownerName: "علی رضایی",
      iban: "IR1234",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a request with neither card nor IBAN", () => {
    const result = createWithdrawalRequestSchema.safeParse({
      amount: 100_000,
      ownerName: "علی رضایی",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid card number (not 16 digits)", () => {
    const result = createWithdrawalRequestSchema.safeParse({
      amount: 100_000,
      ownerName: "علی رضایی",
      cardNumber: "12345",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an amount below the minimum", () => {
    const result = createWithdrawalRequestSchema.safeParse({
      amount: 1000,
      ownerName: "علی رضایی",
      cardNumber: "6037991234567890",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a missing owner name", () => {
    const result = createWithdrawalRequestSchema.safeParse({
      amount: 100_000,
      cardNumber: "6037991234567890",
    });
    expect(result.success).toBe(false);
  });
});

describe("reviewWithdrawalRequestSchema", () => {
  it("accepts a valid approve action", () => {
    const result = reviewWithdrawalRequestSchema.safeParse({ action: "approve" });
    expect(result.success).toBe(true);
  });

  it("accepts a valid reject action with a note", () => {
    const result = reviewWithdrawalRequestSchema.safeParse({
      action: "reject",
      note: "اطلاعات حساب نامعتبر است",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid action", () => {
    const result = reviewWithdrawalRequestSchema.safeParse({ action: "cancel" });
    expect(result.success).toBe(false);
  });
});
