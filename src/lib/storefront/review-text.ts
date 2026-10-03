/**
 * متن نظر برای نمایش: خط‌های خالی (و فاصله‌های ابتدا/انتهای هر خط) حذف
 * می‌شود تا کاربر با Enterهای پشت‌سرهم ارتفاع بی‌خود نگیرد. فقط نمایش؛
 * متن ذخیره‌شده تغییر نمی‌کند.
 */
export function collapseBlankLines(text: string): string {
  return text
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join("\n");
}
