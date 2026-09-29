import { formatJalali } from "@/lib/utils/jalali";
import { toPersianDigits } from "@/lib/utils/format";

/** «۲ ساعت پیش» تا ۷ روز، بعد از آن تاریخ شمسی. تابع خالص و قابل تست. */
export function formatRelativeTime(iso: string, now: Date = new Date()): string {
  const diff = now.getTime() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "همین حالا";
  if (minutes < 60) return `${toPersianDigits(minutes)} دقیقه پیش`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${toPersianDigits(hours)} ساعت پیش`;
  const days = Math.floor(hours / 24);
  if (days < 8) return `${toPersianDigits(days)} روز پیش`;
  return formatJalali(iso);
}
