import { redirect } from "next/navigation";
import Link from "next/link";
import { CreditCard } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/current-user";
import { connectToDatabase } from "@/lib/db/connect";
import { getOrCreateWallet } from "@/lib/wallet/wallet-service";
import { CustomerBankAccount } from "@/models/CustomerBankAccount";
import { PageHeader } from "@/components/storefront/page-header";
import { WalletWithdrawForm } from "@/components/storefront/wallet-withdraw-form";

/**
 * درخواست تسویه — طبق درخواست صریح کارفرما، دیگر فرم بانکی جداگانه
 * ندارد. اگر کاربر هنوز «اطلاعات بانکی» را ذخیره نکرده باشد، اصلاً
 * فرم مبلغ نشان داده نمی‌شود؛ فقط یک پیام + لینک به
 * `/account/bank-info` — همان مرزی که API هم رعایت می‌کند
 * (`wallet/withdrawals/route.ts` بدون `CustomerBankAccount` اصلاً
 * درخواست را نمی‌سازد).
 */
export default async function WalletWithdrawPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?redirect=/account/wallet/withdraw");
  }

  await connectToDatabase();

  const [wallet, bankAccount] = await Promise.all([
    getOrCreateWallet(String(user._id)),
    CustomerBankAccount.findOne({ user: user._id }).lean(),
  ]);

  return (
    <div>
      <PageHeader title="درخواست تسویه" />

      {!bankAccount ? (
        <div className="mx-4 mt-4 space-y-3 rounded-[var(--radius-lg)] border border-dashed border-black/10 bg-white p-5 text-center sm:mx-6">
          <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-violet-50 text-violet-600">
            <CreditCard className="size-6" strokeWidth={1.75} aria-hidden="true" />
          </span>
          <p className="text-sm font-bold text-[var(--sf-ink)]">
            هنوز اطلاعات بانکی ثبت نکرده‌اید
          </p>
          <p className="text-xs text-[var(--sf-ink)]/50">
            برای درخواست تسویه، ابتدا باید شماره کارت یا شبای خود را در
            «اطلاعات بانکی» ثبت کنید.
          </p>
          <Link
            href="/account/bank-info"
            className="mt-2 inline-flex items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary)] px-4 py-2.5 text-xs font-bold text-white active:bg-[var(--color-primary-hover)]"
          >
            ثبت اطلاعات بانکی
          </Link>
        </div>
      ) : (
        <WalletWithdrawForm
          balance={wallet.balance}
          destination={{
            ownerName: bankAccount.ownerName,
            bankName: bankAccount.bankName,
            cardNumber: bankAccount.cardNumber,
            iban: bankAccount.iban,
          }}
        />
      )}
    </div>
  );
}
