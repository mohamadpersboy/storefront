import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/current-user";
import { connectToDatabase } from "@/lib/db/connect";
import { Address } from "@/models/Address";
import { PageHeader } from "@/components/storefront/page-header";
import { AddressListItem } from "@/components/storefront/address-list-item";

export default async function AddressesPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?redirect=/account/addresses");
  }

  await connectToDatabase();
  const addresses = await Address.find({ user: user._id })
    .sort({ isDefault: -1, createdAt: -1 })
    .lean();

  return (
    <div>
      <PageHeader title="آدرس‌های من" />

      <div className="space-y-3 px-4 py-4 sm:px-6">
        <Link
          href="/account/addresses/new"
          className="flex items-center justify-center gap-2 rounded-[var(--radius-lg)] border border-dashed border-black/15 bg-white py-3.5 text-sm font-bold text-[var(--color-primary)] active:bg-gray-50"
        >
          <Plus className="size-4" strokeWidth={2} aria-hidden="true" />
          افزودن آدرس جدید
        </Link>

        {addresses.length === 0 && (
          <p className="px-1 py-6 text-center text-sm text-[var(--sf-ink)]/50">
            هنوز آدرسی ثبت نکرده‌اید.
          </p>
        )}

        {addresses.map((address) => (
          <AddressListItem
            key={String(address._id)}
            id={String(address._id)}
            addressType={address.addressType}
            customTitle={address.customTitle}
            recipientName={address.recipientName}
            phoneNumber={address.phoneNumber}
            province={address.province}
            city={address.city}
            addressLine={address.addressLine}
            isDefault={address.isDefault}
          />
        ))}
      </div>
    </div>
  );
}
