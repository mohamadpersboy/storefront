const faDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];

export function toPersianDigits(input: string | number): string {
  return String(input).replace(/[0-9]/g, (d) => faDigits[Number(d)]);
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
