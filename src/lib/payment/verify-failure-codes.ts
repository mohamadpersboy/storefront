/**
 * کدهای خطای Verify زرین‌پال که معنی رسمی‌شان هنوز با مستند معتبر
 * تأیید نشده است (NOT VERIFIED). تا تأیید، «شکست قطعی» محسوب نمی‌شوند:
 * پرداخت `pending` می‌ماند، برای بررسی دستی علامت می‌خورد، و هیچ استرداد
 * یا اعلان شکستی ارسال نمی‌شود.
 *
 * این ماژول عمداً وابستگی به `env` ندارد تا سرویس‌ها و تست‌ها بتوانند آن را
 * بدون بارگذاری تنظیمات درگاه Import کنند.
 */
export const UNCONFIRMED_VERIFY_FAILURE_CODES: ReadonlySet<number> = new Set([-50, -51, -53, -54]);

export function isUnconfirmedVerifyFailureCode(code: number): boolean {
  return UNCONFIRMED_VERIFY_FAILURE_CODES.has(code);
}
