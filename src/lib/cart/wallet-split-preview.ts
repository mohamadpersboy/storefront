/**
 * پیش‌نمایش تقسیم مبلغ بین کیف پول و درگاه — فقط برای نمایش در UI
 * سبد خرید (بند «پرداخت ترکیبی»، هم‌الگو با منطق واقعی
 * `initiateOrderPayment`: حداکثر تا سقف موجودی واقعی کیف پول کسر
 * می‌شود، نه بیشتر). محاسبه نهایی/واقعی همیشه در Backend
 * (`initiateOrderPayment`) دوباره انجام می‌شود؛ این تابع هرگز مبنای
 * تصمیم مالی نیست، فقط مبنای نمایش عدد به کاربر قبل از ثبت سفارش.
 */
export function computeWalletSplitPreview(walletBalance: number, grandTotal: number) {
  const safeBalance = Math.max(0, walletBalance);
  const safeTotal = Math.max(0, grandTotal);
  const walletPortion = Math.min(safeBalance, safeTotal);
  const gatewayPortion = safeTotal - walletPortion;

  return {
    walletPortion,
    gatewayPortion,
    fullyCoveredByWallet: safeTotal > 0 && gatewayPortion === 0,
  };
}
