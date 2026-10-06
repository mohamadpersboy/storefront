import { getActiveScroller } from "@/lib/storefront/scroll-container";

/**
 * قفل اسکرول با شمارنده: Sheet و Lightbox می‌توانند هم‌زمان باز باشند؛
 * مقدار اولیه فقط یک‌بار (0→1) ذخیره و فقط وقتی آخرین قفل آزاد شد
 * (1→0) برگردانده می‌شود. بدون Listener، پس نشتی ندارد.
 *
 * موبایل/تبلت: `body` و `html` قفل می‌شوند. دسکتاپ: علاوه بر آن قاب
 * (Scroll Container واقعی) هم قفل می‌شود. `overflow: hidden` مقدار
 * `scrollTop` را نگه می‌دارد، پس موقعیت اسکرول بعد از بسته‌شدن حفظ
 * می‌شود.
 */
let lockCount = 0;
let saved: {
  body: string;
  html: string;
  scroller: HTMLElement | null;
  scrollerOverflowY: string;
} | null = null;

export function acquireScrollLock(): void {
  if (typeof document === "undefined") return;
  if (lockCount === 0) {
    const scroller = getActiveScroller();
    saved = {
      body: document.body.style.overflow,
      html: document.documentElement.style.overflow,
      scroller,
      scrollerOverflowY: scroller ? scroller.style.overflowY : "",
    };
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    if (scroller) scroller.style.overflowY = "hidden";
  }
  lockCount += 1;
}

export function releaseScrollLock(): void {
  if (typeof document === "undefined" || lockCount === 0) return;
  lockCount -= 1;
  if (lockCount === 0 && saved) {
    document.body.style.overflow = saved.body;
    document.documentElement.style.overflow = saved.html;
    if (saved.scroller) saved.scroller.style.overflowY = saved.scrollerOverflowY;
    saved = null;
  }
}

export function getScrollLockCount(): number {
  return lockCount;
}
