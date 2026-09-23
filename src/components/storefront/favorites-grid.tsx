"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { FavoriteProductCard } from "@/components/storefront/favorite-product-card";
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
      <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
        <Heart className="h-10 w-10 text-gray-300" strokeWidth={1.5} aria-hidden="true" />
        <p className="text-sm text-[var(--sf-ink)]/60">
          هنوز محصولی را به علاقه‌مندی‌ها اضافه نکرده‌اید.
        </p>
        <Link
          href="/"
          className="mt-1 rounded-full bg-[var(--color-primary)] px-5 py-2.5 text-sm font-bold text-white active:opacity-90"
        >
          مشاهده محصولات
        </Link>
      </div>
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
