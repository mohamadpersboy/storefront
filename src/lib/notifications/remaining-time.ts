import { toPersianDigits } from "@/lib/utils/format";

const MS_PER_HOUR = 60 * 60 * 1000;

/**
 * زمان باقی‌مانده به فارسی، همیشه رو به پایین (هرگز بیشتر از واقعیت
 * نشان نمی‌دهد): کمتر از یک ساعت → «کمتر از یک ساعت»؛ تا ۴۷ ساعت →
 * «N ساعت»؛ بعد از آن «N روز». فقط اختلاف میلی‌ثانیه؛ به Time Zone
 * وابسته نیست.
 */
export function formatRemainingTime(msLeft: number): string {
  if (msLeft < MS_PER_HOUR) return "کمتر از یک ساعت";
  const hours = Math.floor(msLeft / MS_PER_HOUR);
  if (hours < 48) return `${toPersianDigits(hours)} ساعت`;
  return `${toPersianDigits(Math.floor(hours / 24))} روز`;
}
