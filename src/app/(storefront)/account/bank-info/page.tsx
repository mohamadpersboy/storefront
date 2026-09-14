import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { connectToDatabase } from "@/lib/db/connect";
import { CustomerBankAccount } from "@/models/CustomerBankAccount";
import { PageHeader } from "@/components/storefront/page-header";
import { BankInfoSection } from "@/components/storefront/bank-info-section";

export default async function BankInfoPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?redirect=/account/bank-info");
  }

  await connectToDatabase();
  const bankAccount = await CustomerBankAccount.findOne({ user: user._id }).lean();

  return (
    <div>
      <PageHeader title="اطلاعات بانکی" />
      <BankInfoSection
        defaultOwnerName={user.fullName ?? undefined}
        initialData={
          bankAccount
            ? {
                ownerName: bankAccount.ownerName,
                bankName: bankAccount.bankName,
                cardNumber: bankAccount.cardNumber,
                iban: bankAccount.iban,
              }
            : null
        }
      />
    </div>
  );
}
