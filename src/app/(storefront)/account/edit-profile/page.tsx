import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { PageHeader } from "@/components/storefront/page-header";
import { EditFullNameForm } from "@/components/storefront/edit-fullname-form";
import { ChangePhoneForm } from "@/components/storefront/change-phone-form";

export default async function EditProfilePage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?redirect=/account/edit-profile");
  }

  return (
    <div>
      <PageHeader title="ویرایش اطلاعات کاربری" />
      <div className="space-y-4 px-4 py-4 sm:px-6">
        <EditFullNameForm initialFullName={user.fullName ?? ""} />
        <ChangePhoneForm currentPhoneNumber={user.phoneNumber} />
      </div>
    </div>
  );
}
