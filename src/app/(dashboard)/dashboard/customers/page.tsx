import { CustomersPageClient } from "@/components/customers/customers-page-client";

export default function CustomersPage() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-semibold text-foreground">مشتریان</h1>
        <p className="mt-1 text-sm text-muted">
          نمای مدیریتی مشتریان — برای تغییر نقش یا وضعیت حساب از بخش کاربران استفاده کنید
        </p>
      </div>
      <CustomersPageClient />
    </div>
  );
}
