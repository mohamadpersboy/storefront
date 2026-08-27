import { PackageSearch } from "lucide-react";
import type { StorefrontProductCard } from "@/lib/storefront/products";
import { ProductCard } from "./product-card";
import { EmptyState } from "@/components/ui/empty-state";

export function ProductGrid({ products }: { products: StorefrontProductCard[] }) {
  if (products.length === 0) {
    return (
      <EmptyState
        icon={PackageSearch}
        title="محصولی یافت نشد"
        description="با تغییر فیلتر یا جستجو دوباره امتحان کنید."
      />
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
