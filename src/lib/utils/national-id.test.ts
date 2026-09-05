import { describe, it, expect } from "vitest";
import { isValidIranianNationalId } from "@/lib/utils/national-id";

describe("isValidIranianNationalId", () => {
  it("accepts known-valid national IDs", () => {
    expect(isValidIranianNationalId("0499370899")).toBe(true);
    expect(isValidIranianNationalId("0084575948")).toBe(true);
  });

  it("rejects wrong length", () => {
    expect(isValidIranianNationalId("12345")).toBe(false);
    expect(isValidIranianNationalId("123456789012")).toBe(false);
  });

  it("rejects non-digit characters", () => {
    expect(isValidIranianNationalId("04993708a9")).toBe(false);
  });

  it("rejects all-same-digit sequences", () => {
    expect(isValidIranianNationalId("1111111111")).toBe(false);
    expect(isValidIranianNationalId("0000000000")).toBe(false);
  });

  it("rejects an incorrect checksum digit", () => {
    expect(isValidIranianNationalId("0499370890")).toBe(false);
  });

  it("trims surrounding whitespace before validating", () => {
    expect(isValidIranianNationalId(" 0499370899 ")).toBe(true);
  });
});
