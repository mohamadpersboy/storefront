"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { FavoriteProductCard } from "@/components/storefront/favorite-product-card";
import { EmptyState } from "@/components/storefront/empty-state";
import type { ProductCardData } from "@/components/storefront/product-card";

type FavoritesGridProps = {
  initialItems: ProductCardData[];
};

/**
 * State محلی لیست علاقه‌مندی‌های همین صفحه (فقط UI، طبق بند «State
 * Management» بخش ۶ CLAUDE.md) — داده اولیه از Server Component
 * (`page.tsx`) می‌آید؛ حذف هر آیتم (`FavoriteProductCard`) فقط از
 * همین Array محلی کم می‌کند، بدون Refresh کامل صفحه. صفحه‌بندی
 * (`?page=`) خارج از این Component و با Link معمولی مدیریت می‌شود —
 * چون تغییر صفحه یک ناوبری واقعی است، نه یک تغییر State سبک.
 */
export function FavoritesGrid({ initialItems }: FavoritesGridProps) {
  const [items, setItems] = useState(initialItems);

  function handleRemoved(productId: string) {
    setItems((current) => current.filter((item) => item.id !== productId));
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={Heart}
        title="هنوز محصولی را به علاقه‌مندی‌ها اضافه نکرده‌اید"
        actionLabel="مشاهده محصولات"
        actionHref="/"
      />
    );
  }

  // کارت‌ها حالا افقی‌اند (مثل سبد خرید)، پس چیدمان به یک ستون واحد
  // تغییر کرد؛ در Tablet/Desktop عرض کارت‌ها با `max-w` محدود می‌شود
  // تا روی صفحه پهن بیش‌ازحد کشیده نشوند.
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-3">
      {items.map((item) => (
        <FavoriteProductCard key={item.id} item={item} onRemoved={handleRemoved} />
      ))}
    </div>
  );
}
