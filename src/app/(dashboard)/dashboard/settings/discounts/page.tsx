import { DiscountSettingsForm } from "@/components/settings/discount-settings-form";

export default function DiscountSettingsPage() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-semibold text-foreground">تخفیف خودکار پرداخت</h1>
        <p className="mt-1 text-sm text-muted">
          تشویق مشتری بر اساس روش پرداخت، مستقل از کد تخفیف (بند ۳۵-۴۰)
        </p>
      </div>
      <DiscountSettingsForm />
    </div>
  );
}
