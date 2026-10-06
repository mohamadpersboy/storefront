import Link from "next/link";
import { Bell, ChevronLeft, ChevronRight } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/current-user";
import { connectToDatabase } from "@/lib/db/connect";
import { PAGE_SIZE } from "@/lib/notifications/constants";
import { listVisibleNotifications, viewerFromUser } from "@/lib/notifications/queries";
import { parsePageParam } from "@/lib/utils/pagination";
import { toPersianDigits } from "@/lib/utils/format";
import { PageHeader } from "@/components/storefront/page-header";
import { EmptyState } from "@/components/storefront/empty-state";
import { NotificationItem } from "@/components/storefront/notification-item";

export const metadata = { title: "اعلان‌ها" };

// وابسته به Session (Read State و اعلان شخصی)؛ هرگز Static/Cache عمومی نمی‌شود.
export const dynamic = "force-dynamic";

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const page = parsePageParam((await searchParams).page);
  const user = await getCurrentUser();

  await connectToDatabase();
  const { items, pagination } = await listVisibleNotifications({
    viewer: user ? viewerFromUser(user) : null,
    page,
    limit: PAGE_SIZE,
  });
  const { page: currentPage, totalPages } = pagination;

  return (
    <div>
      <PageHeader title="اعلان‌ها" />

      <div className="space-y-4 px-4 py-4 tab:px-6">
        {items.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="اعلان جدیدی ندارید."
            actionLabel="بازگشت به فروشگاه"
            actionHref="/"
          />
        ) : (
          <ul className="divide-y divide-black/5 overflow-hidden rounded-2xl bg-white">
            {items.map((item) => (
              <li key={item.id}>
                <NotificationItem item={item} canMarkRead={Boolean(user)} />
              </li>
            ))}
          </ul>
        )}

        {items.length > 0 && totalPages > 1 ? (
          <nav aria-label="صفحه‌بندی" className="flex items-center justify-center gap-4 pt-2">
            <Link
              href={`/notifications?page=${currentPage + 1}`}
              aria-label="صفحه بعد"
              aria-disabled={currentPage >= totalPages}
              tabIndex={currentPage >= totalPages ? -1 : undefined}
              className={`flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-500 ${
                currentPage >= totalPages ? "pointer-events-none opacity-40" : "active:bg-gray-200"
              }`}
            >
              <ChevronLeft className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
            </Link>
            <span className="text-xs font-medium text-[var(--sf-ink)]/60">
              صفحه {toPersianDigits(currentPage)} از {toPersianDigits(totalPages)}
            </span>
            <Link
              href={`/notifications?page=${currentPage - 1}`}
              aria-label="صفحه قبل"
              aria-disabled={currentPage <= 1}
              tabIndex={currentPage <= 1 ? -1 : undefined}
              className={`flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-500 ${
                currentPage <= 1 ? "pointer-events-none opacity-40" : "active:bg-gray-200"
              }`}
            >
              <ChevronRight className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
            </Link>
          </nav>
        ) : null}
      </div>
    </div>
  );
}
