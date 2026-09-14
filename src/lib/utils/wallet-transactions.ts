/**
 * طبقه‌بندی هر ردیف `WalletTransaction` به یکی از ۴ نوعی که کارفرما
 * برای کیف پول تعریف کرد: شارژ، درخواست تسویه، پرداخت سفارش (چه
 * کامل از کیف پول چه ترکیبی با درگاه)، و تعدیل دستی پشتیبانی.
 *
 * **چرا «پرداخت با کیف پول» و «پرداخت ترکیبی» یک دسته‌اند؟** خود
 * دفتر کیف پول (`WalletTransaction`) فقط «چقدر برای سفارش #X کسر
 * شد» را می‌داند، نه اینکه باقی مبلغ (اگر مانده‌ای بود) از درگاه هم
 * پرداخت شده یا نه — آن تفاوت در خود رکورد `Payment` سفارش
 * (`amount` در برابر `walletAmount`) ثبت است، نه در کیف پول. یعنی
 * از منظر کیف پول، «کامل از کیف پول» و «ترکیبی» دقیقاً یک نوع
 * تراکنش‌اند: یک کسر برای یک سفارش.
 *
 * این تابع «Pure» (بدون DB/زمان) است چون مستقیماً رشته `reason`ای
 * را می‌خواند که `wallet-service.ts` / `initiate-order-payment.ts` /
 * `wallets/withdrawals/[id]/review` می‌نویسند — **اگر متن دقیق آن
 * سه Reason در آینده عوض شود، تست‌های همین فایل باید هم‌زمان
 * به‌روزرسانی شوند**، وگرنه طبقه‌بندی این صفحه خراب می‌شود.
 */
export type WalletTransactionCategory =
  | "topup"
  | "withdrawal"
  | "order_payment"
  | "manual_adjustment";

export function classifyWalletTransaction(reason: string): WalletTransactionCategory {
  if (reason.startsWith("شارژ کیف پول")) {
    return "topup";
  }
  if (reason.startsWith("درخواست برداشت") || reason.startsWith("استرداد درخواست برداشت")) {
    return "withdrawal";
  }
  if (reason.includes("سفارش #")) {
    return "order_payment";
  }
  return "manual_adjustment";
}
