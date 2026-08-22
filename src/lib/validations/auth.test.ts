import { describe, it, expect } from "vitest";
import { otpRequestSchema, otpVerifySchema } from "@/lib/validations/auth";

describe("otpRequestSchema", () => {
  it("accepts a valid Iranian mobile number", () => {
    expect(
      otpRequestSchema.safeParse({ phoneNumber: "09121234567" }).success,
    ).toBe(true);
  });

  it.each([
    "0912123456", // too short
    "091212345678", // too long
    "9121234567", // missing leading 0
    "08121234567", // wrong prefix
    "091212345ab", // non-digit
  ])("rejects invalid phone number: %s", (phoneNumber) => {
    expect(otpRequestSchema.safeParse({ phoneNumber }).success).toBe(false);
  });
});

describe("otpVerifySchema", () => {
  it("accepts a valid phone + 4-digit code", () => {
    expect(
      otpVerifySchema.safeParse({
        phoneNumber: "09121234567",
        code: "1234",
      }).success,
    ).toBe(true);
  });

  it.each(["123", "12345", "abcd"])(
    "rejects invalid OTP code: %s",
    (code) => {
      expect(
        otpVerifySchema.safeParse({ phoneNumber: "09121234567", code })
          .success,
      ).toBe(false);
    },
  );
});
