import Link from "next/link";
import { Search, ShoppingCart, User } from "lucide-react";
import { getStorefrontCategoryTree } from "@/lib/storefront/categories";

/**
 * Cart and account are rendered as disabled placeholders on purpose —
 * per Master Prompt §54, unbuilt sections may appear as disabled/placeholder
 * UI, but never as fake functionality. Real Cart/Account come with the
 * Checkout + Customer-Auth phases of the Storefront (CLAUDE.md §5 Planned).
 */
export async function SiteHeader() {
  const categories = await getStorefrontCategoryTree();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
        <Link href="/" className="shrink-0 text-lg font-bold text-foreground">
          فرش سقطچی
        </Link>

        <form action="/products" method="get" className="hidden flex-1 sm:block">
          <div className="relative">
            <Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              name="search"
              placeholder="جستجوی محصول..."
              className="h-10 w-full rounded-[var(--radius-md)] border border-border bg-surface-subtle pr-9 pl-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary"
            />
          </div>
        </form>

        <div className="ms-auto flex items-center gap-1">
          <button
            type="button"
            disabled
            title="حساب کاربری — به‌زودی"
            className="flex size-10 items-center justify-center rounded-[var(--radius-md)] text-muted opacity-50"
          >
            <User className="size-5" strokeWidth={1.75} />
          </button>
          <button
            type="button"
            disabled
            title="سبد خرید — به‌زودی"
            className="flex size-10 items-center justify-center rounded-[var(--radius-md)] text-muted opacity-50"
          >
            <ShoppingCart className="size-5" strokeWidth={1.75} />
          </button>
        </div>
      </div>

      {categories.length > 0 ? (
        <nav className="border-t border-border">
          <div className="mx-auto flex max-w-6xl items-center gap-5 overflow-x-auto px-4 py-2 text-sm">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/category/${category.slug}`}
                className="shrink-0 whitespace-nowrap text-foreground/80 transition-colors hover:text-primary"
              >
                {category.name}
              </Link>
            ))}
            <Link
              href="/amazing-offers"
              className="shrink-0 whitespace-nowrap font-medium text-danger"
            >
              شگفت‌انگیز
            </Link>
          </div>
        </nav>
      ) : null}

      <form action="/products" method="get" className="border-t border-border px-4 py-2 sm:hidden">
        <div className="relative">
          <Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            name="search"
            placeholder="جستجوی محصول..."
            className="h-10 w-full rounded-[var(--radius-md)] border border-border bg-surface-subtle pr-9 pl-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary"
          />
        </div>
      </form>
    </header>
  );
}
