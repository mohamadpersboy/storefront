import Image from "next/image";
import Link from "next/link";
import { ImageOff } from "lucide-react";
import type { StorefrontProductCard } from "@/lib/storefront/products";
import { formatToman } from "@/lib/utils/format";
import { Badge } from "@/components/ui/badge";

export function ProductCard({ product }: { product: StorefrontProductCard }) {
  return (
    <Link
      href={`/products/${product.slug}`}
      className="group block overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-surface-subtle">
        {product.image ? (
          <Image
            src={product.image.url}
            alt={product.title}
            fill
            sizes="(min-width: 1024px) 22vw, (min-width: 640px) 33vw, 50vw"
            className={
              "object-cover transition-transform duration-300 group-hover:scale-105" +
              (product.inStock ? "" : " grayscale")
            }
          />
        ) : (
          <div className="flex size-full items-center justify-center text-muted-foreground">
            <ImageOff className="size-6" strokeWidth={1.5} />
          </div>
        )}

        {!product.inStock ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <span className="rounded-[var(--radius-sm)] bg-white/95 px-3 py-1 text-xs font-semibold text-foreground">
              ناموجود
            </span>
          </div>
        ) : product.hasAnyDiscount ? (
          <div className="absolute top-2 right-2">
            <Badge tone="danger">تخفیف</Badge>
          </div>
        ) : null}
      </div>

      <div className="p-3">
        <p className="truncate text-xs text-muted">{product.categoryName}</p>
        <h3 className="mt-0.5 line-clamp-2 min-h-10 text-sm font-medium text-foreground">
          {product.title}
        </h3>
        <p className="mt-2 text-sm font-semibold text-foreground">
          {product.startingPrice > 0 ? formatToman(product.startingPrice) : "—"}
        </p>
      </div>
    </Link>
  );
}
