import Link from "next/link";
import { LayoutGrid } from "lucide-react";
import type { StorefrontCategoryNode } from "@/lib/storefront/categories";

export function CategoryTile({ category }: { category: StorefrontCategoryNode }) {
  return (
    <Link
      href={`/category/${category.slug}`}
      className="flex flex-col items-center gap-2 rounded-[var(--radius-lg)] border border-border bg-surface p-4 text-center transition-colors hover:border-primary/40 hover:bg-primary-soft"
    >
      <div className="flex size-11 items-center justify-center rounded-[var(--radius-md)] bg-primary-soft text-primary">
        <LayoutGrid className="size-5" strokeWidth={1.75} />
      </div>
      <span className="text-xs font-medium text-foreground">{category.name}</span>
    </Link>
  );
}
