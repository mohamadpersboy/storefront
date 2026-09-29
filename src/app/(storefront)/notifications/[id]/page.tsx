import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { connectToDatabase } from "@/lib/db/connect";
import {
  getVisibleNotification,
  markNotificationRead,
  viewerFromUser,
} from "@/lib/notifications/queries";
import { formatRelativeTime } from "@/lib/notifications/relative-time";
import { PageHeader } from "@/components/storefront/page-header";

export const dynamic = "force-dynamic";

/**
 * جزئیات اعلان — فقط برای اعلانی که لینک ندارد (لینک، مقصد اصلی است).
 * محتوای HTML در سرور Sanitize شده (هنگام ذخیره و دوباره هنگام خروجی
 * در `toNotificationDetailDTO`)؛ اعلانی که برای این بیننده قابل مشاهده
 * نباشد (شخصی دیگران، Draft، منقضی) ۴۰۴ است.
 */
export default async function NotificationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  const viewer = user ? viewerFromUser(user) : null;

  await connectToDatabase();
  const notification = await getVisibleNotification({ id, viewer });
  if (!notification) notFound();

  if (viewer && !notification.isRead) {
    await markNotificationRead(viewer, id).catch(() => undefined);
  }

  return (
    <div>
      <PageHeader title="اعلان" />
      <article className="space-y-3 px-4 py-4 sm:px-6">
        <h1 className="text-base font-semibold text-[var(--sf-ink)]">{notification.title}</h1>
        <p className="text-[11px] text-gray-400">{formatRelativeTime(notification.publishAt)}</p>

        {notification.imageUrl ? (
          <Image
            src={notification.imageUrl}
            alt=""
            width={800}
            height={450}
            className="h-auto w-full rounded-xl"
          />
        ) : null}

        {notification.contentFormat === "html" ? (
          <div
            className="notification-content text-sm leading-7 text-[var(--sf-ink)]"
            dangerouslySetInnerHTML={{ __html: notification.content }}
          />
        ) : (
          <p className="whitespace-pre-line text-sm leading-7 text-[var(--sf-ink)]">
            {notification.content}
          </p>
        )}

        {notification.link ? (
          <Link href={notification.link} className="inline-block text-sm font-medium text-[var(--color-primary)]">
            مشاهده
          </Link>
        ) : null}
      </article>
    </div>
  );
}
