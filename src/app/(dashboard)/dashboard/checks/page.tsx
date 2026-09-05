import { ChecksPageClient } from "@/components/checks/checks-page-client";

export default function ChecksPage() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-semibold text-foreground">چک‌های دریافتی</h1>
        <p className="mt-1 text-sm text-muted">
          ثبت، مشاهده، عودت و انتقال چک‌های دریافت‌شده از مشتریان
        </p>
      </div>
      <ChecksPageClient />
    </div>
  );
}
