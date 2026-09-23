import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/current-user";
import { connectToDatabase } from "@/lib/db/connect";
import { getFavoriteProductCards, parseFavoritesPage } from "@/lib/storefront/get-favorite-products";
import { toPersianDigits } from "@/lib/utils/format";
import { PageHeader } from "@/components/storefront/page-header";
import { FavoritesGrid } from "@/components/storefront/favorites-grid";

type FavoritesPageProps = {
  searchParams: Promise<{ page?: string }>;
};

export default async function FavoritesPage({ searchParams }: FavoritesPageProps) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?redirect=/favorites");
  }

  const { page: rawPage } = await searchParams;
  const page = parseFavoritesPage(rawPage);

  await connectToDatabase();
  const { items, page: currentPage, totalPages } = await getFavoriteProductCards(
    String(user._id),
    page,
  );

  return (
    <div>
      <PageHeader title="علاقه‌مندی‌ها" />

      <div className="px-4 py-4 sm:px-6">
        <FavoritesGrid initialItems={items} />

        {items.length > 0 && totalPages > 1 ? (
          <div className="mt-6 flex items-center justify-center gap-4">
            <Link
              href={`/favorites?page=${currentPage + 1}`}
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
              href={`/favorites?page=${currentPage - 1}`}
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
