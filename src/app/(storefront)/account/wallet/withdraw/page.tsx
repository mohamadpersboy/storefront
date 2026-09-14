import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { connectToDatabase } from "@/lib/db/connect";
import { getOrCreateWallet } from "@/lib/wallet/wallet-service";
import { CustomerBankAccount } from "@/models/CustomerBankAccount";
import { PageHeader } from "@/components/storefront/page-header";
import { WalletWithdrawForm } from "@/components/storefront/wallet-withdraw-form";

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
      <WalletWithdrawForm
        balance={wallet.balance}
        defaults={{
          ownerName: bankAccount?.ownerName ?? user.fullName ?? "",
          cardNumber: bankAccount?.cardNumber ?? "",
          iban: bankAccount?.iban ?? "",
        }}
      />
    </div>
  );
}
