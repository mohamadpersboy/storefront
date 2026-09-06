const faDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
const arabicIndicDigits = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];

export function toPersianDigits(input: string | number): string {
  return String(input).replace(/[0-9]/g, (d) => faDigits[Number(d)]);
}

/**
 * Converts Persian (۰-۹) and Arabic-Indic (٠-٩) digits to plain ASCII
 * digits. Many phones/OSes type Persian digits directly from a
 * numeric keyboard, so any numeric `<input>` must normalize before
 * stripping non-digit characters — otherwise every digit already
 * shown on screen (rendered in Persian via `toPersianDigits`) looks
 * like a non-digit character and gets wiped on the next keystroke.
 */
export function toEnglishDigits(input: string): string {
  return input.replace(/[۰-۹٠-٩]/g, (d) => {
    const faIndex = faDigits.indexOf(d);
    if (faIndex !== -1) return String(faIndex);
    return String(arabicIndicDigits.indexOf(d));
  });
}

/** Strips everything except digits, after normalizing Persian/Arabic-Indic digits to ASCII. */
export function digitsOnly(value: string): string {
  return toEnglishDigits(value).replace(/[^0-9]/g, "");
}

const tomanFormatter = new Intl.NumberFormat("fa-IR");

/** Formats an integer amount (in Toman) with Persian digit grouping. */
export function formatToman(amount: number): string {
  return `${tomanFormatter.format(amount)} تومان`;
}

export function formatNumber(value: number): string {
  return tomanFormatter.format(value);
}

export function formatPercent(value: number): string {
  return `${toPersianDigits(value)}٪`;
}

/**
 * Formats a person for display as "نام (شماره تلفن)" — always showing
 * both, instead of silently hiding the phone number whenever a name
 * is present.
 */
export function formatPersonWithPhone(
  fullName: string | null | undefined,
  phoneNumber: string,
): string {
  const phone = toPersianDigits(phoneNumber);
  return fullName ? `${fullName} (${phone})` : phone;
}
