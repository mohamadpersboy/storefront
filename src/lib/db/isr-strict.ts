/**
 * ISR_STRICT — رفتار خطای Getterهای صفحات ISR در Docker Runtime.
 *
 * Problem: Getterهای صفحات ISR خطای DB را با `catch` می‌خورند و داده
 * خالی برمی‌گردانند. Next.js آن خروجی خالی را مثل یک نسخه سالم Cache
 * می‌کند. پس هنگام Revalidation با DB قطع، صفحه خالی جایگزین نسخه
 * سالم می‌شود.
 *
 * Rule: اگر `ISR_STRICT=1` باشد و برنامه در Runtime اجرا شود، خطای
 * واقعی اتصال/دسترسی DB دوباره Throw می‌شود. Next.js در این حالت نسخه
 * سالم قبلی را نگه می‌دارد و درخواست بعدی دوباره تلاش می‌کند.
 *
 * Scope:
 * - فقط وقتی `ISR_STRICT === "1"` (Dockerfile فقط در Stage Runner آن
 *   را تنظیم می‌کند). Vercel این متغیر را ندارد: رفتار قبلی.
 * - هرگز در فاز Build (`NEXT_PHASE=phase-production-build`). Build
 *   بدون MongoDB باید موفق شود.
 * - فقط خطاهای DB. نتیجه خالی عادی (`[]`، `null`) خطا نیست و Throw
 *   نمی‌شود.
 *
 * این فایل عمداً به `@/config/env` وابسته نیست تا بدون Env کامل
 * قابل تست باشد.
 */

const BUILD_PHASE = "phase-production-build";

/** خطاهای Mongoose که خطای اتصال/دسترسی نیستند (داده/Schema). */
const NON_DB_ERROR_NAMES = new Set([
  "ValidationError",
  "CastError",
  "DocumentNotFoundError",
  "StrictModeError",
  "VersionError",
]);

export function isIsrStrictActive(
  env: Record<string, string | undefined> = process.env,
): boolean {
  return env.ISR_STRICT === "1" && env.NEXT_PHASE !== BUILD_PHASE;
}

/**
 * خطای اتصال/دسترسی DB: خطاهای Driver (`Mongo*`) و Mongoose
 * (`Mongoose*`، مثل Server Selection و Buffering Timeout)، به‌جز
 * خطاهای داده/Schema. تشخیص با نام است تا به Import مستقیم `mongodb`
 * نیاز نباشد.
 */
export function isDatabaseError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  if (NON_DB_ERROR_NAMES.has(error.name)) return false;
  return error.name.startsWith("Mongo");
}

/**
 * در `catch` Getterها صدا بزنید. در حالت Strict خطای DB را Throw
 * می‌کند. در غیر این صورت برمی‌گردد و Getter مقدار Fallback قبلی را
 * برمی‌گرداند.
 */
export function rethrowIfIsrStrictDbError(
  error: unknown,
  env: Record<string, string | undefined> = process.env,
): void {
  if (isIsrStrictActive(env) && isDatabaseError(error)) {
    throw error;
  }
}
