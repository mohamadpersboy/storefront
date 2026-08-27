import { notFound } from "next/navigation";
import { getStorefrontCategoryBySlug } from "@/lib/storefront/categories";
import { getStorefrontProducts } from "@/lib/storefront/products";
import { ProductGrid } from "@/components/storefront/product-grid";
import { ProductsPagination } from "@/components/storefront/products-pagination";

// Always live — see (storefront)/page.tsx for rationale.
export const dynamic = "force-dynamic";

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { slug } = await params;
  const { page: pageParam } = await searchParams;
  const page = Number(pageParam) > 0 ? Number(pageParam) : 1;

  const category = await getStorefrontCategoryBySlug(slug);
  if (!category) notFound();

  const { products, totalPages } = await getStorefrontProducts({
    page,
    categorySlug: slug,
  });

  return (
    <div>
      <h1 className="mb-4 text-lg font-semibold text-foreground">{category.name}</h1>
      <ProductGrid products={products} />
      <ProductsPagination
        basePath={`/category/${slug}`}
        params={{}}
        page={page}
        totalPages={totalPages}
      />
    </div>
  );
}
