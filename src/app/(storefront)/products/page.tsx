import { getStorefrontProducts } from "@/lib/storefront/products";
import { ProductGrid } from "@/components/storefront/product-grid";
import { ProductsPagination } from "@/components/storefront/products-pagination";

export const metadata = {
  title: "محصولات",
};

// Always live — see (storefront)/page.tsx for rationale.
export const dynamic = "force-dynamic";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; category?: string; search?: string }>;
}) {
  const params = await searchParams;
  const page = Number(params.page) > 0 ? Number(params.page) : 1;

  const { products, totalPages } = await getStorefrontProducts({
    page,
    categorySlug: params.category,
    search: params.search,
  });

  return (
    <div>
      <h1 className="mb-4 text-lg font-semibold text-foreground">
        {params.search ? `نتایج جستجو برای «${params.search}»` : "همه محصولات"}
      </h1>
      <ProductGrid products={products} />
      <ProductsPagination
        basePath="/products"
        params={{ category: params.category, search: params.search }}
        page={page}
        totalPages={totalPages}
      />
    </div>
  );
}
