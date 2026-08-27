"use client";

import { useState } from "react";
import { ShoppingCart } from "lucide-react";
import type { StorefrontVariant } from "@/lib/storefront/products";
import { formatToman } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

function variantLabel(variant: StorefrontVariant) {
  const parts = [
    ...(variant.color ? [variant.color.name] : []),
    ...variant.attributes.map((a) => a.value),
  ];
  return parts.length > 0 ? parts.join(" / ") : variant.unit;
}

export function ProductVariantSelector({ variants }: { variants: StorefrontVariant[] }) {
  const active = variants.filter((v) => v.isActive);
  const initial = active.find((v) => v.inStock) ?? active[0] ?? variants[0];
  const [selectedId, setSelectedId] = useState(initial?.id);
  const selected = variants.find((v) => v.id === selectedId) ?? initial;

  if (!selected) return null;

  return (
    <div className="space-y-4">
      {variants.length > 1 ? (
        <div>
          <p className="mb-2 text-xs font-medium text-muted">انتخاب گزینه</p>
          <div className="flex flex-wrap gap-2">
            {variants.map((variant) => (
              <button
                key={variant.id}
                type="button"
                onClick={() => setSelectedId(variant.id)}
                disabled={!variant.isActive}
                className={cn(
                  "flex items-center gap-1.5 rounded-[var(--radius-md)] border px-3 py-2 text-xs font-medium transition-colors",
                  variant.id === selected.id
                    ? "border-primary bg-primary-soft text-primary"
                    : "border-border text-foreground hover:bg-surface-subtle",
                  !variant.isActive && "cursor-not-allowed opacity-40",
                )}
              >
                {variant.color ? (
                  <span
                    className="size-3 rounded-full border border-border"
                    style={{ backgroundColor: variant.color.hexCode }}
                  />
                ) : null}
                {variantLabel(variant)}
                {!variant.inStock ? " (ناموجود)" : ""}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="flex items-baseline gap-2">
        <span className="text-xl font-bold text-foreground">
          {formatToman(selected.finalPrice)}
        </span>
        {selected.hasDiscount ? (
          <span className="text-sm text-muted-foreground line-through">
            {formatToman(selected.price)}
          </span>
        ) : null}
        <span className="text-xs text-muted">/ {selected.unit}</span>
      </div>

      <p className="text-xs font-medium">
        {selected.inStock ? (
          <span className="text-success">موجود در انبار</span>
        ) : (
          <span className="text-danger">ناموجود</span>
        )}
      </p>

      <button
        type="button"
        disabled
        title="سبد خرید به‌زودی راه‌اندازی می‌شود"
        className="flex h-12 w-full items-center justify-center gap-2 rounded-[var(--radius-md)] bg-primary text-sm font-medium text-primary-foreground opacity-50 disabled:cursor-not-allowed"
      >
        <ShoppingCart className="size-4" />
        افزودن به سبد خرید (به‌زودی)
      </button>
    </div>
  );
}
