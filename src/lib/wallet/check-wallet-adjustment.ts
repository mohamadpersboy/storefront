export type WalletTransactionType = "credit" | "debit";

export interface WalletAdjustmentCheck {
  ok: boolean;
  newBalance: number;
  reason?: string;
}

/**
 * تابع خالص (بدون DB) — فقط قانون کسب‌وکار «موجودی هرگز منفی نشود و
 * مبلغ باید مثبت باشد» را بررسی می‌کند. لایه DB واقعی
 * (`adjustWalletBalance` در `wallet-service.ts`) همین قانون را به‌صورت
 * Atomic هم اعمال می‌کند (چون بین این چک و نوشتن واقعی، یک درخواست
 * هم‌زمان دیگر می‌تواند موجودی را عوض کند) — این تابع فقط برای پیام
 * خطای فوری و تست‌پذیری قانون است، نه تنها خط دفاعی.
 */
export function checkWalletAdjustment(
  currentBalance: number,
  type: WalletTransactionType,
  amount: number,
): WalletAdjustmentCheck {
  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false, newBalance: currentBalance, reason: "مبلغ باید بزرگ‌تر از صفر باشد" };
  }

  if (type === "debit" && amount > currentBalance) {
    return { ok: false, newBalance: currentBalance, reason: "موجودی کیف پول کافی نیست" };
  }

  const newBalance = type === "credit" ? currentBalance + amount : currentBalance - amount;
  return { ok: true, newBalance };
}
