/**
 * توابع خالص برای منطق ژست گالری تصاویر محصول (`ProductImageGallery`)
 * — جدا از خود Component نگه داشته شده‌اند تا بدون DOM/JSDOM قابل
 * تست باشند (طبق قانون پروژه: «Tests are pure-function unit tests
 * only»).
 *
 * دو دسته منطق خالص اینجا هست:
 *
 * ۱. بازنشانی Focus با اسکرول *صفحه* (نه خود گالری) — فقط اسکرول
 *    رو‌به‌پایین.
 * ۲. Pinch-Zoom-and-Pan واقعیِ داخل کانتینر خود تصویر (نه بزرگ‌شدن
 *    کل اسلاید/Focus): محاسبه فاصله دو انگشت، محدودکردن Scale، و
 *    محدودکردن جابه‌جایی (Pan) تا لبه تصویر از کانتینر بیرون نزند.
 */

/** نسبت عرض هر اسلاید نسبت به عرض کانتینر، در حالت عادی (غیر Focus). */
export const DEFAULT_SLIDE_WIDTH_RATIO = 0.6;

/** حداقل اسکرول رو‌به‌پایین صفحه (پیکسل) لازم برای بازنشانی حالت Focus/Zoom. */
export const SCROLL_RESET_THRESHOLD_PX = 4;

/** فاصله اقلیدسی بین دو نقطه لمس — برای محاسبه فاصله دو انگشت روی صفحه. */
export function getTouchDistance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.hypot(x2 - x1, y2 - y1);
}

/**
 * تصمیم می‌گیرد که آیا اسکرول فعلی صفحه (نسبت به موقعیت اسکرول در
 * لحظه Focus/Zoom‌شدن تصویر) باید آن حالت را بازنشانی کند. فقط
 * اسکرول رو‌به‌پایین بازنشانی می‌کند؛ اسکرول رو‌به‌بالا یا
 * بدون‌حرکت تأثیری ندارد.
 */
export function shouldResetFocusOnScroll(
  scrollYAtFocusStart: number,
  currentScrollY: number,
): boolean {
  return currentScrollY - scrollYAtFocusStart >= SCROLL_RESET_THRESHOLD_PX;
}

// --- Pinch-Zoom-and-Pan (داخل کانتینر خود تصویر) ---

/** حداقل/حداکثر مجاز Scale برای Pinch-Zoom روی یک تصویر. */
export const ZOOM_MIN_SCALE = 1;
export const ZOOM_MAX_SCALE = 3;

/** Scale خام را به بازه مجاز محدود می‌کند. */
export function clampZoomScale(scale: number): number {
  if (Number.isNaN(scale)) return ZOOM_MIN_SCALE;
  return Math.min(ZOOM_MAX_SCALE, Math.max(ZOOM_MIN_SCALE, scale));
}

/**
 * حداکثر جابه‌جایی مجاز (پیکسل، در فضای پیش از Scale — چون Transform
 * به‌صورت `translate(...) scale(...)` نوشته می‌شود) در یک بُعد،
 * طوری‌که لبه تصویر Zoom‌شده هرگز از کانتینر بیرون نیفتد/فاصله
 * خالی نشان ندهد. در Scale=۱ همیشه ۰ است (چیزی برای Pan‌کردن نیست).
 */
export function getMaxPanOffsetPx(containerSizePx: number, scale: number): number {
  if (scale <= ZOOM_MIN_SCALE) return 0;
  return (containerSizePx * (scale - 1)) / (2 * scale);
}

/** جابه‌جایی خام را به بازه مجاز (بر اساس اندازه کانتینر و Scale فعلی) محدود می‌کند. */
export function clampPanOffsetPx(
  offsetPx: number,
  containerSizePx: number,
  scale: number,
): number {
  const max = getMaxPanOffsetPx(containerSizePx, scale);
  if (max === 0) return 0;
  return Math.min(max, Math.max(-max, offsetPx));
}
