import { redirect } from "next/navigation";
import Link from "next/link";
import { Ticket, ChevronRight, ChevronLeft } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/current-user";
import { connectToDatabase } from "@/lib/db/connect";
import { getUserCouponHistory } from "@/lib/storefront/get-user-coupon-history";
import { parsePageParam } from "@/lib/utils/pagination";
import { toPersianDigits } from "@/lib/utils/format";
import { PageHeader } from "@/components/storefront/page-header";
import { CouponHistoryRow } from "@/components/storefront/coupon-history-row";
import { EmptyState } from "@/components/storefront/empty-state";

type CouponsPageProps = {
  searchParams: Promise<{ page?: string }>;
};

/**
 * صفحه «کدهای تخفیف من» — طبق عنوان/زیرعنوانی که از قبل در
 * `/account` ثبت شده بود («کدهای تخفیف استفاده‌شده»)، این یک لیست
 * کدهای *قابل‌استفاده* برای گرفتن نیست؛ تاریخچه کدهایی است که کاربر
 * واقعاً روی یک سفارش استفاده کرده. جزئیات تصمیم داده در
 * `get-user-coupon-history.ts`.
 */
export default async function CouponsPage({ searchParams }: CouponsPageProps) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?redirect=/account/coupons");
  }

  const { page: rawPage } = await searchParams;
  const page = parsePageParam(rawPage);

  await connectToDatabase();
  const { items, page: currentPage, totalPages } = await getUserCouponHistory(String(user._id), page);

  return (
    <div>
      <PageHeader title="کدهای تخفیف من" />

      <div className="space-y-4 px-4 py-4 sm:px-6">
        {items.length === 0 ? (
          <EmptyState
            icon={Ticket}
            title="هنوز از هیچ کد تخفیفی استفاده نکرده‌اید"
            actionLabel="مشاهده محصولات"
            actionHref="/"
          />
        ) : (
          <div className="divide-y divide-black/5 overflow-hidden rounded-[var(--radius-lg)] border border-black/5 bg-white">
            {items.map((entry) => (
              <CouponHistoryRow key={entry.id} entry={entry} />
            ))}
          </div>
        )}

        {items.length > 0 && totalPages > 1 ? (
          <div className="flex items-center justify-center gap-4 pt-2">
            <Link
              href={`/account/coupons?page=${currentPage + 1}`}
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
              href={`/account/coupons?page=${currentPage - 1}`}
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
