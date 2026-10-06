/**
 * Scroll Container فعلی Storefront.
 *
 * روی دسکتاپ (≥۱۰۲۴px) قاب موبایل (`[data-sf-scroller]`) تنها
 * Scroll Container است و پنجره Scroll نمی‌کند. روی موبایل/تبلت همان
 * عنصر `display: contents` است (Box ندارد) و پنجره Scroll می‌کند.
 * تشخیص با `getClientRects().length` انجام می‌شود: `display: contents`
 * هیچ Box ای ندارد.
 */
export const SCROLLER_SELECTOR = "[data-sf-scroller]";

export function getActiveScroller(doc: Document = document): HTMLElement | null {
  const el = doc.querySelector<HTMLElement>(SCROLLER_SELECTOR);
  if (!el || el.getClientRects().length === 0) return null;
  return el;
}

/** هدف رویداد `scroll`: قاب روی دسکتاپ، وگرنه پنجره. */
export function getScrollTarget(): HTMLElement | Window {
  return getActiveScroller() ?? window;
}

export function getScrollTop(): number {
  const scroller = getActiveScroller();
  return scroller ? scroller.scrollTop : window.scrollY;
}

export function scrollToTop(behavior: ScrollBehavior = "auto"): void {
  const scroller = getActiveScroller();
  if (scroller) scroller.scrollTo({ top: 0, behavior });
  else window.scrollTo({ top: 0, behavior });
}

/** عرض ناحیه دید: عرض قاب روی دسکتاپ، وگرنه `innerWidth`. */
export function getViewportWidth(): number {
  const scroller = getActiveScroller();
  return scroller ? scroller.clientWidth : window.innerWidth;
}
