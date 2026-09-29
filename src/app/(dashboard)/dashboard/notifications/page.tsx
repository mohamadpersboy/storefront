import { NotificationsPageClient } from "@/components/notifications/notifications-page-client";

export default function NotificationsPage() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-semibold text-foreground">اطلاع‌رسانی</h1>
        <p className="mt-1 text-sm text-muted">اعلان‌های عمومی که برای همه بازدیدکنندگان فروشگاه نمایش داده می‌شود.</p>
      </div>
      <NotificationsPageClient />
    </div>
  );
}
