import { ReferralSettingsForm } from "@/components/settings/referral-settings-form";

export default function ReferralSettingsPage() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-semibold text-foreground">دعوت دوستان</h1>
        <p className="mt-1 text-sm text-muted">
          سقف تعداد دعوت هر کاربر، درصد/سقف پاداش، و حداقل مبلغ اولین
          خرید دعوت‌شده
        </p>
      </div>
      <ReferralSettingsForm />
    </div>
  );
}
