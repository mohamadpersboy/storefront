import { createHmac, randomInt } from "crypto";
import { env } from "@/config/env";

export const OTP_LENGTH = 4;
export const OTP_EXPIRY_SECONDS = 120; // 2 minutes
export const OTP_RESEND_COOLDOWN_SECONDS = 60;
export const OTP_MAX_ATTEMPTS = 5; // per code, before it's invalidated

export function generateOtpCode(): string {
  const min = 10 ** (OTP_LENGTH - 1);
  const max = 10 ** OTP_LENGTH - 1;
  return String(randomInt(min, max + 1));
}

export function hashOtpCode(phoneNumber: string, code: string): string {
  return createHmac("sha256", env.OTP_HASH_SECRET)
    .update(`${phoneNumber}:${code}`)
    .digest("hex");
}

export function verifyOtpHash(
  phoneNumber: string,
  code: string,
  hash: string,
): boolean {
  return hashOtpCode(phoneNumber, code) === hash;
}
