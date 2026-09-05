/**
 * Validates an Iranian national ID (کد ملی) using the standard
 * 10-digit checksum algorithm. Pure function — no I/O, fully unit
 * testable. Used for issuer/guarantor/transfer-recipient fields on
 * `Check` (Master Prompt — Financial Management, بند ۲).
 */
export function isValidIranianNationalId(value: string): boolean {
  const trimmed = value.trim();
  if (!/^\d{10}$/.test(trimmed)) return false;

  // Reject the well-known all-same-digit non-codes (e.g. "0000000000").
  if (/^(\d)\1{9}$/.test(trimmed)) return false;

  const digits = trimmed.split("").map(Number);
  const check = digits[9];

  const sum = digits.slice(0, 9).reduce((acc, digit, index) => acc + digit * (10 - index), 0);
  const remainder = sum % 11;

  return remainder < 2 ? check === remainder : check === 11 - remainder;
}
