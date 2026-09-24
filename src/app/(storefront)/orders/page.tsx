import { redirect } from "next/navigation";
import Link from "next/link";
import { Package, ChevronRight, ChevronLeft } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/current-user";
import { connectToDatabase } from "@/lib/db/connect";
import {
  getUserOrders,
  type OrderListStatusFilter,
} from "@/lib/storefront/get-user-orders";
import { parsePageParam } from "@/lib/utils/pagination";
import { toPersianDigits } from "@/lib/utils/format";
import { PageHeader } from "@/components/storefront/page-header";
import { OrderStatusTabs } from "@/components/storefront/order-status-tabs";
import { OrderCard } from "@/components/storefront/order-card";
import { EmptyState } from "@/components/storefront/empty-state";

const VALID_FILTERS: OrderListStatusFilter[] = ["all", "in_progress", "delivered", "cancelled"];

const EMPTY_STATE_TEXT: Record<OrderListStatusFilter, string> = {
  all: "هنوز سفارشی ثبت نکرده‌اید.",
  in_progress: "سفارش در حال انجامی ندارید.",
  delivered: "سفارش تحویل‌شده‌ای ندارید.",
  cancelled: "سفارش لغوشده‌ای ندارید.",
};

type OrdersPageProps = {
  searchParams: Promise<{ status?: string; page?: string }>;
};

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?redirect=/orders");
  }

  const { status: rawStatus, page: rawPage } = await searchParams;
  const filter: OrderListStatusFilter = VALID_FILTERS.includes(
    rawStatus as OrderListStatusFilter,
  )
    ? (rawStatus as OrderListStatusFilter)
    : "all";
  const page = parsePageParam(rawPage);

  await connectToDatabase();
  const { items, page: currentPage, totalPages } = await getUserOrders(
    String(user._id),
    filter,
    page,
  );

  const pageHref = (targetPage: number) =>
    filter === "all" ? `/orders?page=${targetPage}` : `/orders?status=${filter}&page=${targetPage}`;

  return (
    <div>
      <PageHeader title="سفارش‌های من" />

      <div className="space-y-4 px-4 py-4 sm:px-6">
        <OrderStatusTabs active={filter} />

        {items.length === 0 ? (
          <EmptyState
            icon={Package}
            title={EMPTY_STATE_TEXT[filter]}
            actionLabel="مشاهده محصولات"
            actionHref="/"
          />
        ) : (
          <div className="flex flex-col gap-3">
            {items.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        )}

        {items.length > 0 && totalPages > 1 ? (
          <div className="flex items-center justify-center gap-4 pt-2">
            <Link
              href={pageHref(currentPage + 1)}
              aria-disabled={currentPage >= totalPages}
              className={`flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-500 ${
                currentPage >= totalPages ? "pointer-events-none opacity-40" : "active:bg-gray-200"
              }`}
            >
              {/* در RTL «صفحه بعدی» بصراً به سمت چپ است. */}
              <ChevronLeft className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
            </Link>

            <span className="text-xs font-medium text-[var(--sf-ink)]/60">
              صفحه {toPersianDigits(currentPage)} از {toPersianDigits(totalPages)}
            </span>

            <Link
              href={pageHref(currentPage - 1)}
              aria-disabled={currentPage <= 1}
              className={`flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-500 ${
                currentPage <= 1 ? "pointer-events-none opacity-40" : "active:bg-gray-200"
              }`}
            >
              <ChevronRight className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}
