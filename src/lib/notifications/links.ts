/**
 * لینک/تصویر اعلان: فقط مسیر داخلی (`/...`، نه `//host`) یا `https://`.
 * `javascript:`, `data:`, `http:` و ... رد می‌شوند.
 */
export function isSafeNotificationLink(value: string): boolean {
  if (value.length === 0 || value.length > 500) return false;
  if (/[\s\u0000-\u001f]/.test(value)) return false;
  if (value.startsWith("/")) return !value.startsWith("//") && !value.includes("\\");
  try {
    const url = new URL(value);
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

/** تصویر شاخص اعلان فقط از Cloudinary پروژه (next/image فقط همین Host را مجاز می‌کند). */
export function isSafeNotificationImageUrl(value: string): boolean {
  if (value.length === 0 || value.length > 500) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "res.cloudinary.com";
  } catch {
    return false;
  }
}
