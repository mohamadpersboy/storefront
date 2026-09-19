/**
 * توابع خالص برای منطق ژست گالری تصاویر محصول (`ProductImageGallery`)
 * — جدا از خود Component نگه داشته شده‌اند تا بدون DOM/JSDOM قابل
 * تست باشند (طبق قانون پروژه: «Tests are pure-function unit tests
 * only»).
 *
 * سه دسته منطق خالص اینجا هست:
 *
 * ۱. بازنشانی Focus با اسکرول *صفحه* (نه خود گالری) — فقط اسکرول
 *    رو‌به‌پایین.
 * ۲. Pinch-Zoom-and-Pan واقعیِ داخل کانتینر خود تصویر (نه بزرگ‌شدن
 *    کل اسلاید/Focus): محاسبه فاصله دو انگشت، محدودکردن Scale، و
 *    محدودکردن جابه‌جایی (Pan) تا لبه تصویر از کانتینر بیرون نزند.
 * ۳. محاسبه مقصد اسکرول افقی هنگام Focus‌شدن — به‌جای Center کردن
 *    (که چون بعد از باز‌شدن Transition عرض محاسبه می‌شود، ممکن است
 *    قسمتی از تصویر بیرون از دید بماند)، مقصد را از روی اندازه
 *    *نهایی* (بعد از رشد عرض) از قبل محاسبه می‌کنیم و هم‌زمان با
 *    شروع Transition عرض اسکرول را هم شروع می‌کنیم — تا هر دو با هم
 *    تمام شوند و کل تصویر داخل دید (به‌جای Center، Align به لبه‌ای
 *    که تصویر قبلاً از همان سمت بیرون‌زده بود) قرار بگیرد.
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

// --- محاسبه مقصد اسکرول هنگام Focus (Edge-aligned، نه Center) ---

/** نسبت‌های عرض اسلاید Focus‌شده — دقیقاً هم‌الگو با کلاس Tailwind `w-[min(80vw,90%)]`. */
export const FOCUSED_SLIDE_VIEWPORT_RATIO = 0.8;
export const FOCUSED_SLIDE_CONTAINER_RATIO = 0.9;

/** عرض نهایی اسلاید بعد از Focus — `min(80vw, 90%عرض‌کانتینر)`. */
export function getFocusedSlideWidthPx(containerWidthPx: number, viewportWidthPx: number): number {
  return Math.min(
    viewportWidthPx * FOCUSED_SLIDE_VIEWPORT_RATIO,
    containerWidthPx * FOCUSED_SLIDE_CONTAINER_RATIO,
  );
}

/**
 * موقعیت چپ نهایی اسلاید شماره `index` در ردیف Flex، *بعد از* اینکه
 * همه اسلایدها با هم به `slideWidthPx` رشد کردند (چون Focus مشترک
 * بین همه تصاویر است، نه فقط یکی — نگاه کنید `ProductImageGallery`).
 * فرض: `items-start`، بدون Padding روی خود Track، `gapPx` بین هر دو
 * اسلاید.
 */
export function getSlideOffsetLeftPx(index: number, slideWidthPx: number, gapPx: number): number {
  return index * (slideWidthPx + gapPx);
}

/** عرض کل محتوای Track بعد از Focus — برای محدودکردن اسکرول به بازه معتبر. */
export function getTrackContentWidthPx(itemCount: number, slideWidthPx: number, gapPx: number): number {
  if (itemCount <= 0) return 0;
  return itemCount * slideWidthPx + (itemCount - 1) * gapPx;
}

/**
 * تصمیم می‌گیرد اسلاید Tap‌شده باید به لبه راست دید Align شود یا لبه
 * چپ — بر اساس اینکه *قبل از* رشد عرض، کدام سمتش از دید (کانتینر
 * قابل‌اسکرول) بیرون‌زده بود: بیرون‌زدن سمت راست → Align راست؛
 * بیرون‌زدن سمت چپ → Align چپ. اگر کاملاً داخل دید بود (بیرون‌زدگی
 * در هیچ سمتی نبود)، نزدیک‌ترین لبه بر اساس مرکز انتخاب می‌شود.
 */
export function shouldAlignSlideToRightEdge(
  itemLeft: number,
  itemRight: number,
  viewportLeft: number,
  viewportRight: number,
): boolean {
  const overflowsRight = itemRight > viewportRight;
  const overflowsLeft = itemLeft < viewportLeft;

  if (overflowsRight && !overflowsLeft) return true;
  if (overflowsLeft && !overflowsRight) return false;

  const itemCenter = (itemLeft + itemRight) / 2;
  const viewportCenter = (viewportLeft + viewportRight) / 2;
  return itemCenter > viewportCenter;
}

/**
 * مقصد `scrollLeft` برای اینکه اسلاید Focus‌شده کامل داخل دید بیفتد،
 * با لبه‌اش (راست یا چپ، طبق `shouldAlignSlideToRightEdge`) دقیقاً
 * روی لبه دید — نه وسط‌چین، که ممکن است لبه مقابل را بیرون بیندازد.
 */
export function getEdgeAlignedScrollLeft(
  offsetLeftPx: number,
  slideWidthPx: number,
  containerWidthPx: number,
  alignToRightEdge: boolean,
): number {
  return alignToRightEdge ? offsetLeftPx + slideWidthPx - containerWidthPx : offsetLeftPx;
}

/** مقدار خام `scrollLeft` را به بازه معتبر (۰ تا حداکثر ممکن) محدود می‌کند. */
export function clampScrollLeft(scrollLeftPx: number, maxScrollLeftPx: number): number {
  const max = Math.max(0, maxScrollLeftPx);
  return Math.min(max, Math.max(0, scrollLeftPx));
}
