/**
 * توابع خالص برای منطق ژست/ارتفاع گالری تصاویر محصول
 * (`ProductImageGallery`). جدا از خود Component نگه داشته شده‌اند
 * تا بدون DOM/JSDOM قابل تست باشند — طبق قانون پروژه: «Tests are
 * pure-function unit tests only».
 *
 * مفهوم «Progress»: عددی بین ۰ (حالت عادی، ≈۴۰vh) و ۱ (حداکثر باز،
 * ≈۶۰vh). ارتفاع واقعی هیچ‌وقت مستقیم اینجا محاسبه نمی‌شود — فقط
 * همین عدد بدون‌واحد، تا خودِ Component با `calc(40dvh + progress *
 * 20dvh)` آن را به CSS تبدیل کند (طبق بند ۹ Master Prompt: حفظ ۴۰٪/
 * ۶۰٪ واقعی Viewport، نه یک مقدار پیکسل ثابت).
 */

export const GALLERY_MIN_HEIGHT_VH = 40;
export const GALLERY_MAX_HEIGHT_VH = 60;
export const GALLERY_HEIGHT_RANGE_VH = GALLERY_MAX_HEIGHT_VH - GALLERY_MIN_HEIGHT_VH;

/** چند پیکسل درگ عمودی لازم است تا Progress از ۰ به ۱ کامل برسد. */
export const VERTICAL_DRAG_RANGE_PX = 140;

/** چند پیکسل اسکرول صفحه لازم است تا گالری کاملاً از حالت باز به ۴۰vh برگردد. */
export const SCROLL_COLLAPSE_RANGE_PX = 120;

/** حداقل جابه‌جایی (پیکسل) قبل از تشخیص جهت غالب ژست (افقی/عمودی). */
export const GESTURE_DIRECTION_THRESHOLD_PX = 8;

/** بعد از رهاکردن، اگر Progress از این آستانه بیشتر باشد، به‌جای بازگشت به حالت اولیه، کاملاً باز می‌ماند. */
export const RELEASE_SNAP_THRESHOLD = 0.5;

/** حداقل پیکسل درگ افقی برای رفتن به تصویر بعدی/قبلی. */
export const HORIZONTAL_SWIPE_THRESHOLD_PX = 50;

export type GestureDirection = "horizontal" | "vertical" | null;

/** عدد را بین ۰ و ۱ محدود می‌کند (Progress هیچ‌وقت نباید از این بازه خارج شود). */
export function clampProgress(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

/**
 * جابه‌جایی عمودی خام درگ (پیکسل) را به Progress تبدیل می‌کند.
 * کشیدن به بالا (`deltaY` منفی) باید گالری را باز کند، پس علامت
 * برعکس می‌شود.
 */
export function verticalDeltaToProgress(
  deltaYPx: number,
  startProgress: number,
): number {
  return clampProgress(startProgress + -deltaYPx / VERTICAL_DRAG_RANGE_PX);
}

/** ارتفاع CSS معتبر گالری را از Progress می‌سازد (`calc(40dvh + progress*20dvh)`). */
export function progressToHeightCss(progress: number): string {
  const clamped = clampProgress(progress);
  return `calc(${GALLERY_MIN_HEIGHT_VH}dvh + ${clamped * GALLERY_HEIGHT_RANGE_VH}dvh)`;
}

/** بعد از رهاکردن درگ عمودی، تصمیم می‌گیرد گالری کاملاً باز بماند یا به حالت اولیه برگردد. */
export function resolveReleaseProgress(currentProgress: number): number {
  return currentProgress >= RELEASE_SNAP_THRESHOLD ? 1 : 0;
}

/**
 * اسکرول صفحه (پیکسل، از لحظه‌ای که گالری در حالت باز بود) را به
 * Progress تبدیل می‌کند — تک‌جهته: فقط بستن، هرگز دوباره باز نمی‌کند.
 */
export function scrollYToCollapsingProgress(
  scrollYPx: number,
  progressAtScrollStart: number,
): number {
  if (scrollYPx <= 0) return progressAtScrollStart;
  const remaining = progressAtScrollStart * (1 - scrollYPx / SCROLL_COLLAPSE_RANGE_PX);
  return clampProgress(remaining);
}

/**
 * با توجه به جابه‌جایی اولیه (چند پیکسل از شروع لمس)، جهت غالب ژست
 * را تشخیص می‌دهد. قبل از رسیدن به آستانه، `null` برمی‌گرداند (هنوز
 * زود است قضاوت کرد) — طبق بند ۷ Master Prompt: «تشخیص جهت غالب
 * قبل از Commit به یک تعامل».
 */
export function resolveGestureDirection(
  deltaXPx: number,
  deltaYPx: number,
): GestureDirection {
  const absX = Math.abs(deltaXPx);
  const absY = Math.abs(deltaYPx);
  if (Math.max(absX, absY) < GESTURE_DIRECTION_THRESHOLD_PX) return null;
  return absX > absY ? "horizontal" : "vertical";
}

/**
 * بعد از رهاکردن درگ افقی، ایندکس تصویر فعال بعدی را تصمیم می‌گیرد.
 * `deltaXPx` مثبت (کشیدن به راست) یعنی تصویر قبلی؛ منفی یعنی تصویر
 * بعدی — دقیقاً هم‌قرارداد با `HeroSlider`.
 */
export function resolveSlideIndex(
  currentIndex: number,
  deltaXPx: number,
  slideCount: number,
): number {
  if (slideCount <= 1) return 0;
  if (Math.abs(deltaXPx) < HORIZONTAL_SWIPE_THRESHOLD_PX) return currentIndex;
  const direction = deltaXPx > 0 ? -1 : 1;
  return (currentIndex + direction + slideCount) % slideCount;
}
