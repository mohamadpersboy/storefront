import { Search } from "lucide-react";

/**
 * Prominent search entry point below the header (Master Prompt §8).
 *
 * This is a static link into the (not-yet-built) search/product listing
 * route for now — it must not simulate search results itself. Once the
 * product listing page exists, this becomes a real `<form>`/`<Link>` that
 * navigates to it with the query string, reusing the existing product API
 * rather than introducing a second search implementation.
 */
export function StorefrontSearchBar() {
  return (
    <div className="px-4 pb-4">
      <a
        href="/search"
        aria-label="جستجوی محصولات"
        className="flex h-12 items-center gap-2 rounded-[var(--radius-lg)] border border-border bg-surface-subtle px-4 text-muted transition-colors hover:bg-[var(--sf-accent-soft)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--sf-accent)]"
      >
        <Search className="h-4.5 w-4.5 shrink-0" aria-hidden="true" />
        <span className="text-sm">جستجوی فرش، موکت، پشتی و...</span>
      </a>
    </div>
  );
}
