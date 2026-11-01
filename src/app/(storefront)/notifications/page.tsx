import { getCurrentUser } from "@/lib/auth/current-user";
import { connectToDatabase } from "@/lib/db/connect";
import { PAGE_SIZE } from "@/lib/notifications/constants";
import { listVisibleNotificationsDetailed, viewerFromUser } from "@/lib/notifications/queries";
import { NotificationsChat } from "@/components/storefront/notifications-chat";

export const metadata = { title: "اعلان‌ها" };

// وابسته به Session (Read State و اعلان شخصی)؛ هرگز Static/Cache عمومی نمی‌شود.
export const dynamic = "force-dynamic";

/**
 * صفحهٔ اعلان‌ها به شکل چت پیام‌رسان. فقط اولین صفحه (جدیدترین‌ها) در
 * سرور خوانده می‌شود؛ پیام‌های قدیمی‌تر با دکمهٔ بالای چت از API
 * (`?view=chat`) می‌آیند.
 */
export default async function NotificationsPage() {
  const user = await getCurrentUser();

  await connectToDatabase();
  const { items, pagination, generatedAt } = await listVisibleNotificationsDetailed({
    viewer: user ? viewerFromUser(user) : null,
    page: 1,
    limit: PAGE_SIZE,
  });

  return (
    <NotificationsChat
      initialItems={items}
      initialHasMore={pagination.hasNextPage}
      canMarkRead={Boolean(user)}
      now={generatedAt}
    />
  );
}
