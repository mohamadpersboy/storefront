import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { NotificationForm } from "@/components/notifications/notification-form";

export default function NewNotificationPage() {
  return (
    <div className="flex flex-col gap-4">
      <Link href="/dashboard/notifications" className="flex w-fit items-center gap-1 text-sm text-muted hover:text-foreground">
        <ChevronRight className="size-4" />
        بازگشت به لیست
      </Link>
      <NotificationForm />
    </div>
  );
}
