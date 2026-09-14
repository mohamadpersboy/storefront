import { describe, expect, it } from "vitest";
import { saveBankInfoSchema } from "./bank-info";

describe("saveBankInfoSchema", () => {
  it("accepts a valid card number", () => {
    const result = saveBankInfoSchema.safeParse({
      ownerName: "علی محمدی",
      cardNumber: "6037991234567890",
      iban: "",
    });
    expect(result.success).toBe(true);
  });

  it("accepts a valid IBAN", () => {
    const result = saveBankInfoSchema.safeParse({
      ownerName: "علی محمدی",
      cardNumber: "",
      iban: "IR820540102680020817909002",
    });
    expect(result.success).toBe(true);
  });

  it("accepts an optional bank name", () => {
    const result = saveBankInfoSchema.safeParse({
      ownerName: "علی محمدی",
      bankName: "بانک تجارت",
      cardNumber: "6037991234567890",
    });
    expect(result.success).toBe(true);
  });

  it("rejects when neither card number nor IBAN is provided", () => {
    const result = saveBankInfoSchema.safeParse({
      ownerName: "علی محمدی",
      cardNumber: "",
      iban: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a card number that is not 16 digits", () => {
    const result = saveBankInfoSchema.safeParse({
      ownerName: "علی محمدی",
      cardNumber: "12345",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an IBAN without the IR prefix", () => {
    const result = saveBankInfoSchema.safeParse({
      ownerName: "علی محمدی",
      iban: "820540102680020817909002",
    });
    expect(result.success).toBe(false);
  });
});
