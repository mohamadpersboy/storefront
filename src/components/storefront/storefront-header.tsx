import { MapPin, ShoppingBag } from "lucide-react";

/**
 * Compact top header for the Storefront homepage.
 *
 * Per Master Prompt §7/§37/§38: no sidebar, no heavy desktop nav — this
 * stays a slim brand/location/cart bar on every breakpoint. The primary
 * mobile navigation lives in the (not-yet-built) fixed bottom nav.
 *
 * Cart badge: the `Cart` model doesn't exist in the backend yet (see
 * CLAUDE.md — it's planned as part of this Storefront build, not a
 * separate Dashboard feature). Until that lands, this renders with a
 * real, honest empty count (0) rather than a fake number — no badge is
 * shown at all when the count is zero, matching Master Prompt §52's
 * "never fake a cart count" requirement.
 */
export function StorefrontHeader({
  storeName = "فرش سقطچی",
  location,
  cartCount = 0,
}: {
  storeName?: string;
  location?: string;
  cartCount?: number;
}) {
  return (
    <header className="flex items-center justify-between gap-3 px-4 pt-4 pb-3">
      <a
        href="/cart"
        aria-label="سبد خرید"
        className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border bg-white text-foreground transition-colors hover:bg-surface-subtle"
      >
        <ShoppingBag className="h-5 w-5" aria-hidden="true" />
        {cartCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--sf-accent)] px-1 text-[11px] font-semibold text-white">
            {cartCount}
          </span>
        )}
      </a>

      <div className="flex flex-1 flex-col items-end text-right">
        <span className="text-lg font-bold text-[var(--sf-ink)]">
          {storeName}
        </span>
        {location && (
          <span className="mt-0.5 flex items-center gap-1 text-xs text-muted">
            {location}
            <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
        )}
      </div>
    </header>
  );
}
