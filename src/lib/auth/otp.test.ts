import { describe, it, expect } from "vitest";
import {
  generateOtpCode,
  hashOtpCode,
  verifyOtpHash,
  OTP_LENGTH,
} from "@/lib/auth/otp";

describe("generateOtpCode", () => {
  it("generates a code of the configured length", () => {
    const code = generateOtpCode();
    expect(code).toHaveLength(OTP_LENGTH);
    expect(code).toMatch(/^\d+$/);
  });

  it("never generates a code with a leading zero", () => {
    // Leading zero would silently truncate to fewer digits when
    // parsed as a number anywhere downstream — must never happen.
    for (let i = 0; i < 50; i++) {
      expect(generateOtpCode()[0]).not.toBe("0");
    }
  });
});

describe("hashOtpCode / verifyOtpHash", () => {
  it("produces a verifiable hash for the correct phone+code pair", () => {
    const hash = hashOtpCode("09121234567", "4821");
    expect(verifyOtpHash("09121234567", "4821", hash)).toBe(true);
  });

  it("rejects verification with the wrong code", () => {
    const hash = hashOtpCode("09121234567", "4821");
    expect(verifyOtpHash("09121234567", "0000", hash)).toBe(false);
  });

  it("rejects verification with the wrong phone number", () => {
    const hash = hashOtpCode("09121234567", "4821");
    expect(verifyOtpHash("09129999999", "4821", hash)).toBe(false);
  });

  it("never stores the raw code inside the hash output", () => {
    const hash = hashOtpCode("09121234567", "4821");
    expect(hash).not.toContain("4821");
  });
});
