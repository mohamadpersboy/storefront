import { ShippingSettingsForm } from "@/components/settings/shipping-settings-form";

export default function ShippingSettingsPage() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-semibold text-foreground">ارسال</h1>
        <p className="mt-1 text-sm text-muted">
          آستانه ارسال رایگان که به‌صورت بنر در صفحه اصلی فروشگاه نمایش داده می‌شود
        </p>
      </div>
      <ShippingSettingsForm />
    </div>
  );
}
