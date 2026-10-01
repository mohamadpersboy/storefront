/**
 * قفل اسکرول `body`/`html` با شمارنده: Sheet و Lightbox می‌توانند هم‌زمان
 * باز باشند؛ مقدار اولیه فقط یک‌بار (0→1) ذخیره و فقط وقتی آخرین قفل
 * آزاد شد (1→0) برگردانده می‌شود. بدون Listener، پس نشتی ندارد.
 */
let lockCount = 0;
let saved: { body: string; html: string } | null = null;

export function acquireScrollLock(): void {
  if (typeof document === "undefined") return;
  if (lockCount === 0) {
    saved = {
      body: document.body.style.overflow,
      html: document.documentElement.style.overflow,
    };
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
  }
  lockCount += 1;
}

export function releaseScrollLock(): void {
  if (typeof document === "undefined" || lockCount === 0) return;
  lockCount -= 1;
  if (lockCount === 0 && saved) {
    document.body.style.overflow = saved.body;
    document.documentElement.style.overflow = saved.html;
    saved = null;
  }
}

export function getScrollLockCount(): number {
  return lockCount;
}
