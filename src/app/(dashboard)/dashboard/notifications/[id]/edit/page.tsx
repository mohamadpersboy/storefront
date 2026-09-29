import Link from "next/link";
import mongoose from "mongoose";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { NotificationForm, type NotificationFormInitial } from "@/components/notifications/notification-form";
import { connectToDatabase } from "@/lib/db/connect";
import { Notification } from "@/models/Notification";

export default async function EditNotificationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) notFound();

  await connectToDatabase();
  const doc = await Notification.findOne({ _id: id, audience: "public" }).lean();
  if (!doc) notFound();

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
    publishAt: doc.publishAt.toISOString(),
    expiresAt: doc.expiresAt ? doc.expiresAt.toISOString() : null,
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
