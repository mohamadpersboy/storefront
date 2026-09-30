import Link from "next/link";
import mongoose from "mongoose";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { NotificationForm, type NotificationFormInitial } from "@/components/notifications/notification-form";
import { connectToDatabase } from "@/lib/db/connect";
import { Notification } from "@/models/Notification";
import { getNotificationConfig } from "@/lib/notifications/runtime-config";
import { localDateKey } from "@/lib/notifications/timezone";

export default async function EditNotificationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) notFound();

  await connectToDatabase();
  const doc = await Notification.findOne({ _id: id, audience: "public" }).lean();
  if (!doc) notFound();

  const { timeZone } = getNotificationConfig();
  const initial: NotificationFormInitial = {
    id,
    type: (["announcement", "promotion", "coupon", "special_offer", "system"] as const).includes(
      doc.type as "announcement",
    )
      ? (doc.type as NotificationFormInitial["type"])
      : "announcement",
    title: doc.title,
    content: doc.content,
    imageUrl: doc.imageUrl ?? null,
    link: doc.link ?? null,
    status: doc.status,
    // پیش‌نویس تاریخ انتخاب‌شده ندارد مگر واقعاً در آینده باشد.
    publishDate:
      doc.status === "draft" && doc.publishAt <= new Date() ? null : localDateKey(doc.publishAt, timeZone),
    expiresDate: doc.expiresAt ? localDateKey(doc.expiresAt, timeZone) : null,
    publishLocked: doc.status !== "draft" && doc.publishAt <= new Date(),
  };

  return (
    <div className="flex flex-col gap-4">
      <Link href="/dashboard/notifications" className="flex w-fit items-center gap-1 text-sm text-muted hover:text-foreground">
        <ChevronRight className="size-4" />
        بازگشت به لیست
      </Link>
      <NotificationForm initial={initial} />
    </div>
  );
}
