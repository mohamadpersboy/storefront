/**
 * توابع خالص برای ژست Drag-to-Dismiss پاپ‌آپ‌های Bottom-Sheet (مثل
 * `ProductPriceChartButton`) — جدا از خود Component نگه داشته شده‌اند
 * تا بدون DOM/JSDOM قابل تست باشند (طبق قانون پروژه: «Tests are
 * pure-function unit tests only»).
 */

/** مدت زمان انیمیشن باز/بسته‌شدن Sheet (ورود از پایین / خروج به پایین). */
export const SHEET_TRANSITION_MS = 300;

/** نسبت ارتفاع Sheet که اگر بیشتر از آن درگ شود، بسته می‌شود. */
export const DISMISS_DRAG_RATIO = 0.3;

/** حداقل مطلق پیکسل درگ لازم برای بستن — برای Sheetهای کوتاه که ٪۳۰ ارتفاعشان خیلی کم است. */
export const DISMISS_DRAG_MIN_PX = 80;

/** درگ رو‌به‌بالا را نادیده می‌گیرد (Sheet فقط رو‌به‌پایین کشیده می‌شود، نه بالاتر از جای اصلی‌اش). */
export function clampDragOffsetPx(offsetPx: number): number {
  return Math.max(0, offsetPx);
}

/**
 * تصمیم می‌گیرد که آیا مقدار درگ فعلی برای بستن Sheet کافی است —
 * حداقل ۳۰٪ ارتفاع خودِ Sheet، ولی هرگز کمتر از یک آستانه مطلق
 * (برای Sheetهای کوتاه که ۳۰٪ ارتفاعشان ناچیز است).
 */
export function shouldDismissBottomSheet(dragOffsetPx: number, sheetHeightPx: number): boolean {
  const requiredDragPx = Math.max(sheetHeightPx * DISMISS_DRAG_RATIO, DISMISS_DRAG_MIN_PX);
  return dragOffsetPx >= requiredDragPx;
}
