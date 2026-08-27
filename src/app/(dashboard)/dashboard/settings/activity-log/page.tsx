import { ActivityLogPageClient } from "@/components/settings/activity-log-page-client";

export default function ActivityLogPage() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-semibold text-foreground">تاریخچه فعالیت‌ها</h1>
        <p className="mt-1 text-sm text-muted">
          چه کسی، چه تغییر حساسی را کِی انجام داده (بند ۵۳ Master Prompt)
        </p>
      </div>
      <ActivityLogPageClient />
    </div>
  );
}
