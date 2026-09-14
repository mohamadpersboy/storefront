import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { PageHeader } from "@/components/storefront/page-header";
import { AddressForm } from "@/components/storefront/address-form";

export default async function NewAddressPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?redirect=/account/addresses/new");
  }

  return (
    <div>
      <PageHeader title="آدرس جدید" />
      <AddressForm mode="create" />
    </div>
  );
}
