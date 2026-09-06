/**
 * نام فروشگاه — تنها نقطه‌ای که برای تغییر نام فروشگاه در متن پیامک
 * کارت باید ویرایش شود.
 */
const STORE_NAME = "سرای فرش سَقَطچی";

export interface CardShareDetails {
  cardNumber: string;
  shabaNumber: string;
  bankName: string;
  ownerName: string;
}

/**
 * متن پیامک «ارسال شماره کارت به مشتری» را می‌سازد (کارت‌ها →
 * دکمهٔ ارسال). طبق درخواست کارفرما، این تابع تنها جایی است که باید
 * برای تغییر متن/قالب این پیامک در آینده ویرایش شود — بدون نیاز به
 * تغییر در Route یا UI.
 */
export function buildCardShareMessage({
  cardNumber,
  shabaNumber,
  bankName,
  ownerName,
}: CardShareDetails): string {
  return [
    `شماره کارت: ${cardNumber}`,
    `شماره شبا: ${shabaNumber}`,
    `بانک: ${bankName}`,
    `به نام: ${ownerName}`,
    STORE_NAME,
  ].join("\n");
}
