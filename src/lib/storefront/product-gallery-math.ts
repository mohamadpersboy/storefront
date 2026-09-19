/**
 * توابع خالص برای منطق ژست گالری تصاویر محصول (`ProductImageGallery`)
 * — بازطراحی کامل. جدا از خود Component نگه داشته شده‌اند تا بدون
 * DOM/JSDOM قابل تست باشند (طبق قانون پروژه: «Tests are pure-function
 * unit tests only»).
 *
 * این نسخه جایگزین منطق قبلی (درگ عمودی برای باز/بسته‌شدن ارتفاع +
 * افقی برای رفتن به اسلاید بعدی) شده است. طراحی جدید یک لیست افقی
 * قابل‌اسکرول با انگشت است (اسکرول Native مرورگر، بدون ردیابی
 * دستی Pointer)، به‌علاوه دو منطق خالص که واقعاً نیاز به محاسبه دارند:
 *
 * ۱. تشخیص ژست Pinch-Zoom دو‌انگشتی روی یک تصویر (برای Focus‌کردن آن).
 * ۲. تشخیص اینکه آیا اسکرول *صفحه* (نه خود گالری) باید حالت Focus را
 *    بازنشانی کند — فقط اسکرول رو‌به‌پایین، طبق درخواست صریح کارفرما.
 */

/** نسبت عرض هر اسلاید نسبت به عرض کانتینر، در حالت عادی (غیر Focus). */
export const DEFAULT_SLIDE_WIDTH_RATIO = 0.6;

/** ضریب افزایش فاصله دو انگشت که به‌عنوان ژست Pinch-Zoom-In شناخته می‌شود. */
export const PINCH_ZOOM_IN_SCALE_THRESHOLD = 1.15;

/** حداقل اسکرول رو‌به‌پایین صفحه (پیکسل) لازم برای بازنشانی حالت Focus. */
export const SCROLL_RESET_THRESHOLD_PX = 4;

/** فاصله اقلیدسی بین دو نقطه لمس — برای محاسبه فاصله دو انگشت روی صفحه. */
export function getTouchDistance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.hypot(x2 - x1, y2 - y1);
}

/**
 * با مقایسه فاصله دو انگشت در لحظه شروع ژست با فاصله فعلی، تشخیص
 * می‌دهد که آیا کاربر انگشت‌ها را از هم دور کرده (ژست Zoom In) یا نه.
 * فاصله شروع نامعتبر/صفر هرگز به‌عنوان ژست معتبر شناخته نمی‌شود.
 */
export function isPinchZoomGesture(startDistancePx: number, currentDistancePx: number): boolean {
  if (startDistancePx <= 0) return false;
  return currentDistancePx / startDistancePx >= PINCH_ZOOM_IN_SCALE_THRESHOLD;
}

/**
 * تصمیم می‌گیرد که آیا اسکرول فعلی صفحه (نسبت به موقعیت اسکرول در
 * لحظه Focus‌شدن تصویر) باید حالت Focus را بازنشانی کند. فقط اسکرول
 * رو‌به‌پایین بازنشانی می‌کند؛ اسکرول رو‌به‌بالا یا بدون‌حرکت تأثیری
 * ندارد.
 */
export function shouldResetFocusOnScroll(
  scrollYAtFocusStart: number,
  currentScrollY: number,
): boolean {
  return currentScrollY - scrollYAtFocusStart >= SCROLL_RESET_THRESHOLD_PX;
}
