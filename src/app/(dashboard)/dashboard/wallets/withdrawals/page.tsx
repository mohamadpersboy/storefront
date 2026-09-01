import { WithdrawalsQueue } from "@/components/wallets/withdrawals-queue";

export default function WalletWithdrawalsPage() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-semibold text-foreground">درخواست‌های برداشت</h1>
        <p className="mt-1 text-sm text-muted">
          بررسی و تسویه درخواست‌های برداشت به کارت/شبا — واریز واقعی خارج از این سیستم (کارت‌به‌کارت یا پایا/ساتنا) انجام می‌شود
        </p>
      </div>
      <WithdrawalsQueue />
    </div>
  );
}
