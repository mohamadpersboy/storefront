import { notFound } from "next/navigation";
import { PackageSearch } from "lucide-react";
import { PageHeader } from "@/components/storefront/page-header";
import { BreadcrumbNav } from "@/components/storefront/breadcrumb-nav";
import { CategoryFilterBar, CategoryFilterSidebar } from "@/components/storefront/category-filter-bar";
import { ProductGrid } from "@/components/storefront/product-grid";
import { CategoryPagination } from "@/components/storefront/category-pagination";
import { EmptyState } from "@/components/storefront/empty-state";
import { connectToDatabase } from "@/lib/db/connect";
import {
  getCategoryWithSubcategories,
  getCategoryFacets,
  getCategoryProducts,
  resolveCategoryScopeIds,
} from "@/lib/storefront/category-listing";
import {
  parseCategoryProductsQuery,
  CATEGORY_PAGE_SIZE,
} from "@/lib/validations/storefront-category-products";

type RawSearchParams = Record<string, string | string[] | undefined>;

type CategoryPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<RawSearchParams>;
};

/** یک شبه‌دسته ثابت برای «همه محصولات» — نگاه کنید توضیح معماری در گزارش پایان فاز. */
const ALL_PRODUCTS_SLUG = "all";

function toURLSearchParams(raw: RawSearchParams): URLSearchParams {
  const usp = new URLSearchParams();
  for (const [key, value] of Object.entries(raw)) {
    if (Array.isArray(value)) value.forEach((v) => usp.append(key, v));
    else if (value !== undefined) usp.append(key, value);
  }
  return usp;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (slug === ALL_PRODUCTS_SLUG) {
    return { title: "همه محصولات | فرش سقطچی" };
  }

  await connectToDatabase();
  const category = await getCategoryWithSubcategories(slug);
  if (!category) return {};

  return {
    title: `${category.name} | فرش سقطچی`,
    description: `خرید انواع ${category.name} از فروشگاه اینترنتی فرش سقطچی`,
  };
}

export default async function CategoryDetailPage({ params, searchParams }: CategoryPageProps) {
  const { slug } = await params;
  const query = parseCategoryProductsQuery(toURLSearchParams(await searchParams));

  await connectToDatabase();

  const isAll = slug === ALL_PRODUCTS_SLUG;
  const category = isAll ? null : await getCategoryWithSubcategories(slug);
  if (!isAll && !category) notFound();

  const subcategories = category?.subcategories ?? [];
  const categoryIds = isAll
    ? null
    : await resolveCategoryScopeIds(category!.id, query.subcategory, subcategories);

  const basePath = `/categories/${slug}`;

  const [facets, { items, pagination }] = await Promise.all([
    getCategoryFacets(categoryIds),
    getCategoryProducts({
      categoryIds,
      brandSlugs: query.brand,
      attrs: query.attrs,
      minPrice: query.minPrice,
      maxPrice: query.maxPrice,
      search: query.search,
      sort: query.sort,
      page: query.page,
      limit: CATEGORY_PAGE_SIZE,
    }),
  ]);

  const pageTitle = isAll ? "همه محصولات" : category!.name;
  const activeFilters = {
    search: query.search ?? "",
    sort: query.sort,
    subcategory: query.subcategory,
    brand: query.brand,
    attrs: query.attrs,
    minPrice: query.minPrice,
    maxPrice: query.maxPrice,
  };

  return (
    <div>
      <PageHeader title={pageTitle} />

      <div className="px-4 py-3 sm:px-6">
        <BreadcrumbNav
          items={[
            { label: "خانه", href: "/" },
            { label: "دسته‌بندی‌ها", href: "/categories" },
            { label: pageTitle },
          ]}
        />

        <div className="mt-3">
          <CategoryFilterBar
            basePath={basePath}
            active={activeFilters}
            facets={facets}
            subcategories={subcategories}
          />
        </div>

        <div className="mt-4 lg:flex lg:items-start lg:gap-4">
          <CategoryFilterSidebar basePath={basePath} active={activeFilters} facets={facets} />

          <div className="flex-1">
            {items.length > 0 ? (
              <>
                <ProductGrid items={items} />
                <div className="mt-6 flex justify-center">
                  <CategoryPagination basePath={basePath} page={pagination.page} totalPages={pagination.totalPages} />
                </div>
              </>
            ) : (
              <EmptyState
                icon={PackageSearch}
                title="محصولی با این مشخصات پیدا نشد"
                description="می‌توانید فیلترها را پاک کنید یا جستجوی دیگری را امتحان کنید."
                actionLabel="پاک کردن فیلترها"
                actionHref={basePath}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
