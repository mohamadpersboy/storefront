import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { PageHeader } from "@/components/storefront/page-header";
import { WalletTopupForm } from "@/components/storefront/wallet-topup-form";

export default async function WalletTopupPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?redirect=/account/wallet/topup");
  }

  return (
    <div>
      <PageHeader title="شارژ کیف پول" />
      <WalletTopupForm />
    </div>
  );
}
