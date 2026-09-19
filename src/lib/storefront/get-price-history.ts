import { isoToJalali, PERSIAN_MONTH_NAMES } from "@/lib/utils/jalali";
import { toPersianDigits } from "@/lib/utils/format";

export type WeeklyPricePoint = { weekLabel: string; price: number };

const WEEKS_COUNT = 8;
const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;
const MAX_FLUCTUATION_RATIO = 0.06; // ±۶٪
const PRICE_ROUNDING_STEP = 1000;

/**
 * عدد شبه‌تصادفی پایدار بین ۰ و ۱، ساخته‌شده از یک رشته Seed — فقط
 * برای این‌که نمودار Mock هر بار Reload یکسان بماند (نه واقعاً
 * تصادفی هر بار)، هیچ هدف امنیتی ندارد.
 */
function seededRandom(seed: string, index: number): number {
  let hash = 0;
  const input = `${seed}:${index}`;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return (hash % 1000) / 1000;
}

/**
 * تاریخچه قیمت هفتگی محصول — MOCK. هیچ مدل Backend‌ای برای تاریخچه
 * واقعی قیمت وجود ندارد (نیازمند یک Snapshot دوره‌ای/Cron که یک
 * تصمیم معماری جداست، خارج از Scope این دکمه). طبق بند ۱۳ سند
 * Storefront («از Mock Data فقط جایی استفاده کن که هنوز API واقعی
 * آماده نیست»)، این تابع یک نوسان قابل‌قبول و *پایدار* (بر اساس
 * Seed محصول، نه واقعاً تصادفی هر Render) حول قیمت فعلی می‌سازد.
 * هفته آخر (جاری) همیشه دقیقاً همان قیمت واقعی فعلی است.
 *
 * شکل داده (`weekLabel`/`price`) با آنچه یک API واقعی برمی‌گرداند
 * هماهنگ نگه داشته شده تا وقتی آن مدل ساخته شد، فقط منبع داده اینجا
 * عوض شود، بدون Rewrite کردن UI (`ProductPriceChartButton`).
 */
export function getMockWeeklyPriceHistory(
  productId: string,
  currentPrice: number,
): WeeklyPricePoint[] {
  const now = new Date();
  const points: WeeklyPricePoint[] = [];

  for (let weeksAgo = WEEKS_COUNT - 1; weeksAgo >= 0; weeksAgo -= 1) {
    const date = new Date(now.getTime() - weeksAgo * MS_PER_WEEK);
    const { jm, jd } = isoToJalali(date.toISOString());
    const weekLabel = `${toPersianDigits(jd)} ${PERSIAN_MONTH_NAMES[jm - 1]}`;

    if (weeksAgo === 0) {
      points.push({ weekLabel, price: currentPrice });
      continue;
    }

    const fluctuation = (seededRandom(productId, weeksAgo) - 0.5) * 2 * MAX_FLUCTUATION_RATIO;
    const price =
      Math.round((currentPrice * (1 + fluctuation)) / PRICE_ROUNDING_STEP) * PRICE_ROUNDING_STEP;
    points.push({ weekLabel, price });
  }

  return points;
}
