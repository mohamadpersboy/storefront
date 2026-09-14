import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { connectToDatabase } from "@/lib/db/connect";
import { Address } from "@/models/Address";
import { PageHeader } from "@/components/storefront/page-header";
import { AddressForm } from "@/components/storefront/address-form";

export default async function EditAddressPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?redirect=/account/addresses");
  }

  const { id } = await params;
  if (!/^[0-9a-fA-F]{24}$/.test(id)) {
    notFound();
  }

  await connectToDatabase();

  // مالکیت با `user: user._id` در همان Query چک می‌شود — دقیقاً
  // هم‌الگو با مرز مالکیت در API (`/api/v1/addresses/[id]`).
  const address = await Address.findOne({ _id: id, user: user._id }).lean();
  if (!address) {
    notFound();
  }

  return (
    <div>
      <PageHeader title="ویرایش آدرس" />
      <AddressForm
        mode="edit"
        addressId={String(address._id)}
        initialValues={{
          addressType: address.addressType,
          customTitle: address.customTitle ?? "",
          recipientName: address.recipientName,
          phoneNumber: address.phoneNumber,
          province: address.province,
          city: address.city,
          addressLine: address.addressLine,
          postalCode: address.postalCode,
          latitude: address.latitude,
          longitude: address.longitude,
          isDefault: address.isDefault,
        }}
      />
    </div>
  );
}
