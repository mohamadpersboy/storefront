/**
 * Converts a non-negative integer amount into its Persian words
 * representation (e.g. 1234 -> "یک هزار و دویست و سی و چهار"),
 * generated from the numeric value so no duplicate "amount in words"
 * ever needs to be stored alongside the numeric amount in the
 * database (Master Prompt — Financial Management, بند ۲).
 *
 * Pure function — no I/O, fully unit testable.
 */

const ONES = [
  "",
  "یک",
  "دو",
  "سه",
  "چهار",
  "پنج",
  "شش",
  "هفت",
  "هشت",
  "نه",
];

const TEENS = [
  "ده",
  "یازده",
  "دوازده",
  "سیزده",
  "چهارده",
  "پانزده",
  "شانزده",
  "هفده",
  "هجده",
  "نوزده",
];

const TENS = [
  "",
  "",
  "بیست",
  "سی",
  "چهل",
  "پنجاه",
  "شصت",
  "هفتاد",
  "هشتاد",
  "نود",
];

const HUNDREDS = [
  "",
  "صد",
  "دویست",
  "سیصد",
  "چهارصد",
  "پانصد",
  "ششصد",
  "هفتصد",
  "هشتصد",
  "نهصد",
];

const SCALES = ["", "هزار", "میلیون", "میلیارد", "تریلیون", "کوادریلیون"];

function threeDigitToWords(n: number): string {
  const parts: string[] = [];
  const hundred = Math.floor(n / 100);
  const remainder = n % 100;

  if (hundred > 0) parts.push(HUNDREDS[hundred]);

  if (remainder >= 10 && remainder < 20) {
    parts.push(TEENS[remainder - 10]);
  } else {
    const ten = Math.floor(remainder / 10);
    const one = remainder % 10;
    if (ten > 0) parts.push(TENS[ten]);
    if (one > 0) parts.push(ONES[one]);
  }

  return parts.join(" و ");
}

/** @throws if amount is negative, non-finite, or not an integer. */
export function numberToPersianWords(amount: number): string {
  if (!Number.isFinite(amount) || !Number.isInteger(amount) || amount < 0) {
    throw new Error("مبلغ باید یک عدد صحیح غیرمنفی باشد");
  }

  if (amount === 0) return "صفر";

  const groups: number[] = [];
  let remaining = amount;
  while (remaining > 0) {
    groups.push(remaining % 1000);
    remaining = Math.floor(remaining / 1000);
  }

  if (groups.length > SCALES.length) {
    throw new Error("مبلغ برای تبدیل به حروف بیش از حد بزرگ است");
  }

  const words: string[] = [];
  for (let i = groups.length - 1; i >= 0; i--) {
    const group = groups[i];
    if (group === 0) continue;
    const groupWords = threeDigitToWords(group);
    words.push(SCALES[i] ? `${groupWords} ${SCALES[i]}` : groupWords);
  }

  return words.join(" و ");
}

/** Convenience wrapper matching how amounts are displayed elsewhere ("... تومان"). */
export function tomanAmountToWords(amount: number): string {
  return `${numberToPersianWords(amount)} تومان`;
}
