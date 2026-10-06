/**
 * مقصد Portal برای Overlay های Storefront.
 *
 * روی دسکتاپ `#sf-overlay-root` داخل قاب است، پس Sheet و Modal ها از
 * قاب بیرون نمی‌زنند. اگر وجود نداشت (موبایل/تبلت یا صفحه بدون قاب)
 * `document.body` برگردانده می‌شود.
 */
export const OVERLAY_ROOT_ID = "sf-overlay-root";

export function getOverlayRoot(): HTMLElement {
  return document.getElementById(OVERLAY_ROOT_ID) ?? document.body;
}
