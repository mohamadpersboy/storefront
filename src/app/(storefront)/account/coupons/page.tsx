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
          <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
            <Ticket className="h-10 w-10 text-gray-300" strokeWidth={1.5} aria-hidden="true" />
            <p className="text-sm text-[var(--sf-ink)]/60">هنوز از هیچ کد تخفیفی استفاده نکرده‌اید.</p>
            <Link
              href="/"
              className="mt-1 rounded-full bg-[var(--color-primary)] px-5 py-2.5 text-sm font-bold text-white active:opacity-90"
            >
              مشاهده محصولات
            </Link>
          </div>
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
