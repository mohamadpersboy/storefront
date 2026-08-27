import Link from "next/link";
import { getStorefrontCategoryTree } from "@/lib/storefront/categories";
import { getFeaturedProducts } from "@/lib/storefront/products";
import { getActiveStorefrontAmazingOffers } from "@/lib/storefront/amazing-offers";
import { CategoryTile } from "@/components/storefront/category-tile";
import { ProductGrid } from "@/components/storefront/product-grid";
import { AmazingOfferStrip } from "@/components/storefront/amazing-offer-strip";

// Prices/stock/offers must always reflect the live database — never a
// build-time snapshot — so this page is explicitly opted out of static
// prerendering (also avoids `next build` needing a live MongoDB connection).
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [categories, featuredProducts, offers] = await Promise.all([
    getStorefrontCategoryTree(),
    getFeaturedProducts(8),
    getActiveStorefrontAmazingOffers(8),
  ]);

  return (
    <div className="space-y-10">
      <section className="overflow-hidden rounded-[var(--radius-lg)] border border-border bg-gradient-to-l from-primary-soft to-surface p-6 sm:p-10">
        <h1 className="max-w-md text-xl font-bold text-foreground sm:text-2xl">
          فرش سقطچی؛ مرجع تخصصی فرش، موکت و کناره
        </h1>
        <p className="mt-2 max-w-md text-sm leading-6 text-muted">
          انتخاب و خرید انواع فرش ماشینی، قالیچه، تابلو فرش و پادری با
          کیفیت اصل و ارسال به سراسر کشور.
        </p>
        <Link
          href="/products"
          className="mt-4 inline-flex h-11 items-center justify-center gap-2 rounded-[var(--radius-md)] bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover"
        >
          مشاهده محصولات
        </Link>
      </section>

      {categories.length > 0 ? (
        <section>
          <h2 className="mb-3 text-base font-semibold text-foreground">دسته‌بندی‌ها</h2>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-8">
            {categories.map((category) => (
              <CategoryTile key={category.id} category={category} />
            ))}
          </div>
        </section>
      ) : null}

      <AmazingOfferStrip offers={offers} />

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">محصولات جدید</h2>
          <Link href="/products" className="text-xs font-medium text-primary">
            مشاهده همه
          </Link>
        </div>
        <ProductGrid products={featuredProducts} />
      </section>
    </div>
  );
}
