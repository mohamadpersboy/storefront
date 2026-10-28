/**
 * کلیدهای Idempotency عملیات کیف پول مرتبط با یک Payment. هر Payment حداکثر
 * یک‌بار کسر و حداکثر یک‌بار استرداد کیف پول دارد، حتی اگر مسیرهای مختلف
 * (شروع پرداخت، Callback درگاه) آن را تکرار یا هم‌زمان اجرا کنند.
 */
export const paymentWalletDebitKey = (paymentId: unknown): string =>
  `payment-wallet-debit:${String(paymentId)}`;

/** مشترک بین شکست شروع پرداخت و شکست Verify در Callback: یک Payment فقط یک‌بار استرداد می‌گیرد. */
export const paymentRefundKey = (paymentId: unknown): string => `payment-refund:${String(paymentId)}`;
