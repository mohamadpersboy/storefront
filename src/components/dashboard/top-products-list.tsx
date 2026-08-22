import { mockTopProducts } from "@/lib/mock/dashboard";
import { formatToman, toPersianDigits } from "@/lib/utils/format";

export function TopProductsList({
  products = mockTopProducts,
}: {
  products?: typeof mockTopProducts;
}) {
  return (
    <ul className="flex flex-col divide-y divide-border">
      {products.map((product, index) => (
        <li key={product.id} className="flex items-center gap-3 px-5 py-3">
          <span className="flex size-6 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-surface-subtle text-xs font-medium text-muted">
            {toPersianDigits(index + 1)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">
              {product.title}
            </p>
            <p className="mt-0.5 text-xs text-muted">
              {toPersianDigits(product.sold)} فروش
            </p>
          </div>
          <span className="shrink-0 text-sm font-medium tabular-nums text-foreground/80">
            {formatToman(product.revenue)}
          </span>
        </li>
      ))}
    </ul>
  );
}
