"use client";

import { useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { digitsOnly, toPersianDigits } from "@/lib/utils/format";
import {
  serializeAttributeFilter,
  type CategoryAttributeFilter,
  type CategorySortValue,
} from "@/lib/validations/storefront-category-products";
import type { CategoryFacets } from "@/lib/storefront/category-listing";

const SORT_OPTIONS: { value: CategorySortValue; label: string }[] = [
  { value: "default", label: "پیش‌فرض" },
  { value: "newest", label: "جدیدترین" },
  { value: "cheapest", label: "ارزان‌ترین" },
  { value: "expensive", label: "گران‌ترین" },
];

const SEARCH_DEBOUNCE_MS = 400;

export type ActiveCategoryFilters = {
  search: string;
  sort: CategorySortValue;
  brand: string[];
  attrs: CategoryAttributeFilter[];
  minPrice?: number;
  maxPrice?: number;
};

/**
 * منطق مشترک تغییر URL Query بین Sidebar دسکتاپ و Drawer موبایل —
 * چون هر دو مستقیماً از `useSearchParams`/`router.push` خودشان
 * می‌خوانند/می‌نویسند (نه یک State مشترک React)، دو Instance جدا از
 * این Hook همیشه با هم هماهنگ می‌مانند (منبع واحد حقیقت = خودِ URL).
 */
function useCategoryFilterActions(basePath: string) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function pushParams(mutate: (params: URLSearchParams) => void) {
    const next = new URLSearchParams(searchParams.toString());
    mutate(next);
    next.delete("page");
    const qs = next.toString();
    router.push(qs ? `${basePath}?${qs}` : basePath, { scroll: false });
  }

  function toggleBrand(slug: string) {
    pushParams((params) => {
      const current = params.getAll("brand").flatMap((v) => v.split(","));
      const next = current.includes(slug) ? current.filter((s) => s !== slug) : [...current, slug];
      params.delete("brand");
      if (next.length > 0) params.set("brand", next.join(","));
    });
  }

  function toggleAttr(attr: CategoryAttributeFilter) {
    const serialized = serializeAttributeFilter(attr);
    pushParams((params) => {
      const current = params.getAll("attr");
      const next = current.includes(serialized)
        ? current.filter((v) => v !== serialized)
        : [...current, serialized];
      params.delete("attr");
      for (const v of next) params.append("attr", v);
    });
  }

  function applyPriceRange(min: string, max: string) {
    pushParams((params) => {
      const cleanMin = digitsOnly(min);
      const cleanMax = digitsOnly(max);
      if (cleanMin) params.set("minPrice", cleanMin);
      else params.delete("minPrice");
      if (cleanMax) params.set("maxPrice", cleanMax);
      else params.delete("maxPrice");
    });
  }

  function handleSearchChange(value: string) {
    pushParams((params) => {
      if (value.trim()) params.set("search", value.trim());
      else params.delete("search");
    });
  }

  function handleSortChange(value: CategorySortValue) {
    pushParams((params) => {
      if (value === "default") params.delete("sort");
      else params.set("sort", value);
    });
  }

  function clearAll() {
    router.push(basePath, { scroll: false });
  }

  return { toggleBrand, toggleAttr, applyPriceRange, handleSearchChange, handleSortChange, clearAll };
}

function hasActiveFilters(active: ActiveCategoryFilters): boolean {
  return (
    active.search.length > 0 ||
    active.brand.length > 0 ||
    active.attrs.length > 0 ||
    active.minPrice !== undefined ||
    active.maxPrice !== undefined
  );
}

/**
 * نوار ابزار بالای شبکه محصولات: جستجو (Debounce شده) + دکمه فیلتر
 * (فقط موبایل، Drawer را باز می‌کند) + مرتب‌سازی — هم موبایل هم
 * دسکتاپ همین یک نوار را می‌بینند (بند ۱۲ درخواست). فیلترهای
 * برند/ویژگی/قیمت در دسکتاپ داخل `CategoryFilterSidebar` (کنار همین
 * نوار) و در موبایل داخل همین Drawer نمایش داده می‌شوند.
 */
export function CategoryFilterBar({
  basePath,
  active,
  facets,
}: {
  basePath: string;
  active: ActiveCategoryFilters;
  facets: CategoryFacets;
}) {
  const { toggleBrand, toggleAttr, applyPriceRange, handleSearchChange, handleSortChange, clearAll } =
    useCategoryFilterActions(basePath);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // همگام‌سازی State محلی با تغییر URL (مثلاً برگشت/جلو مرورگر) —
  // در زمان Render (نه داخل `useEffect`) طبق الگوی رسمی React برای
  // «تنظیم State هنگام تغییر Prop» (بدون رندر اضافه/Effect غیرلازم؛
  // نگاه کنید react-hooks/set-state-in-effect).
  const [prevActive, setPrevActive] = useState(active);
  const [searchValue, setSearchValue] = useState(active.search);
  const [priceMin, setPriceMin] = useState(active.minPrice ? String(active.minPrice) : "");
  const [priceMax, setPriceMax] = useState(active.maxPrice ? String(active.maxPrice) : "");
  if (active !== prevActive) {
    setPrevActive(active);
    setSearchValue(active.search);
    setPriceMin(active.minPrice ? String(active.minPrice) : "");
    setPriceMax(active.maxPrice ? String(active.maxPrice) : "");
  }

  function onSearchInput(value: string) {
    setSearchValue(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => handleSearchChange(value), SEARCH_DEBOUNCE_MS);
  }

  const activeFiltersExist = hasActiveFilters(active);

  return (
    <div>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => onSearchInput(e.target.value)}
            placeholder="جستجوی فرش..."
            className="w-full rounded-full border border-black/10 bg-white py-2.5 pe-9 ps-4 text-xs outline-none focus:border-[var(--sf-accent)]"
          />
        </div>

        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className={cn(
            "flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-2.5 text-xs font-bold lg:hidden",
            activeFiltersExist
              ? "border-[var(--sf-accent)] bg-[var(--sf-accent-soft)] text-[var(--sf-accent)]"
              : "border-black/10 text-[var(--sf-ink)]/70",
          )}
        >
          <SlidersHorizontal className="size-4" />
          فیلتر
        </button>

        <select
          value={active.sort}
          onChange={(e) => handleSortChange(e.target.value as CategorySortValue)}
          className="shrink-0 rounded-full border border-black/10 bg-white px-3 py-2.5 text-xs font-bold text-[var(--sf-ink)]/70 outline-none"
          aria-label="مرتب‌سازی"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              مرتب‌سازی: {opt.label}
            </option>
          ))}
        </select>
      </div>

      {drawerOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDrawerOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-2xl bg-white px-4 pb-[calc(env(safe-area-inset-bottom)+16px)] pt-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-bold text-[var(--sf-ink)]">فیلترها</h2>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="بستن"
                className="flex size-8 items-center justify-center rounded-full bg-gray-100 text-gray-500"
              >
                <X className="size-4" />
              </button>
            </div>

            <CategoryFilterFields
              facets={facets}
              activeBrandSlugs={active.brand}
              activeAttrs={active.attrs}
              priceMin={priceMin}
              priceMax={priceMax}
              onToggleBrand={toggleBrand}
              onToggleAttr={toggleAttr}
              onPriceMinChange={setPriceMin}
              onPriceMaxChange={setPriceMax}
              onPriceBlur={() => applyPriceRange(priceMin, priceMax)}
            />

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  clearAll();
                  setDrawerOpen(false);
                }}
                className="flex-1 rounded-full border border-black/10 py-2.5 text-xs font-bold text-[var(--sf-ink)]/70"
              >
                پاک کردن فیلترها
              </button>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="flex-1 rounded-full bg-[var(--sf-accent)] py-2.5 text-xs font-bold text-white"
              >
                نمایش نتایج
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/** Sidebar فیلترهای دسکتاپ — همیشه‌نمایان، کنار Grid محصولات (بند ۱۲ درخواست). */
export function CategoryFilterSidebar({
  basePath,
  active,
  facets,
}: {
  basePath: string;
  active: ActiveCategoryFilters;
  facets: CategoryFacets;
}) {
  const { toggleBrand, toggleAttr, applyPriceRange, clearAll } = useCategoryFilterActions(basePath);
  const [prevActive, setPrevActive] = useState(active);
  const [priceMin, setPriceMin] = useState(active.minPrice ? String(active.minPrice) : "");
  const [priceMax, setPriceMax] = useState(active.maxPrice ? String(active.maxPrice) : "");
  if (active !== prevActive) {
    setPrevActive(active);
    setPriceMin(active.minPrice ? String(active.minPrice) : "");
    setPriceMax(active.maxPrice ? String(active.maxPrice) : "");
  }

  return (
    <aside className="hidden w-64 shrink-0 rounded-[var(--radius-lg)] border border-black/5 bg-white p-4 lg:block">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-bold text-[var(--sf-ink)]">فیلترها</h2>
        {hasActiveFilters(active) ? (
          <button type="button" onClick={clearAll} className="text-xs text-[var(--sf-accent)]">
            پاک کردن
          </button>
        ) : null}
      </div>

      <CategoryFilterFields
        facets={facets}
        activeBrandSlugs={active.brand}
        activeAttrs={active.attrs}
        priceMin={priceMin}
        priceMax={priceMax}
        onToggleBrand={toggleBrand}
        onToggleAttr={toggleAttr}
        onPriceMinChange={setPriceMin}
        onPriceMaxChange={setPriceMax}
        onPriceBlur={() => applyPriceRange(priceMin, priceMax)}
      />
    </aside>
  );
}

function CategoryFilterFields({
  facets,
  activeBrandSlugs,
  activeAttrs,
  priceMin,
  priceMax,
  onToggleBrand,
  onToggleAttr,
  onPriceMinChange,
  onPriceMaxChange,
  onPriceBlur,
}: {
  facets: CategoryFacets;
  activeBrandSlugs: string[];
  activeAttrs: CategoryAttributeFilter[];
  priceMin: string;
  priceMax: string;
  onToggleBrand: (slug: string) => void;
  onToggleAttr: (attr: CategoryAttributeFilter) => void;
  onPriceMinChange: (value: string) => void;
  onPriceMaxChange: (value: string) => void;
  onPriceBlur: () => void;
}) {
  const isAttrActive = (name: string, value: string) =>
    activeAttrs.some((a) => a.name === name && a.value === value);

  return (
    <div className="space-y-5">
      <div>
        <p className="mb-2 text-xs font-bold text-[var(--sf-ink)]">بازه قیمت (تومان)</p>
        <div className="flex items-center gap-2">
          <input
            type="text"
            inputMode="numeric"
            value={priceMin ? toPersianDigits(priceMin) : ""}
            onChange={(e) => onPriceMinChange(digitsOnly(e.target.value))}
            onBlur={onPriceBlur}
            placeholder="حداقل"
            className="w-full rounded-lg border border-black/10 px-3 py-2 text-xs outline-none focus:border-[var(--sf-accent)]"
          />
          <span className="text-gray-300">—</span>
          <input
            type="text"
            inputMode="numeric"
            value={priceMax ? toPersianDigits(priceMax) : ""}
            onChange={(e) => onPriceMaxChange(digitsOnly(e.target.value))}
            onBlur={onPriceBlur}
            placeholder="حداکثر"
            className="w-full rounded-lg border border-black/10 px-3 py-2 text-xs outline-none focus:border-[var(--sf-accent)]"
          />
        </div>
      </div>

      {facets.brands.length > 0 ? (
        <div>
          <p className="mb-2 text-xs font-bold text-[var(--sf-ink)]">برند</p>
          <div className="space-y-1.5">
            {facets.brands.map((brand) => (
              <label
                key={brand.id}
                className="flex cursor-pointer items-center gap-2 text-xs text-[var(--sf-ink)]/70"
              >
                <input
                  type="checkbox"
                  checked={activeBrandSlugs.includes(brand.slug)}
                  onChange={() => onToggleBrand(brand.slug)}
                  className="size-4 rounded border-gray-300 accent-[var(--sf-accent)]"
                />
                {brand.name}
              </label>
            ))}
          </div>
        </div>
      ) : null}

      {facets.attributes.map((attribute) => (
        <div key={attribute.name}>
          <p className="mb-2 text-xs font-bold text-[var(--sf-ink)]">{attribute.name}</p>
          <div className="flex flex-wrap gap-1.5">
            {attribute.values.map((value) => {
              const active = isAttrActive(attribute.name, value);
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => onToggleAttr({ name: attribute.name, value })}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-[11px] font-bold",
                    active
                      ? "border-[var(--sf-accent)] bg-[var(--sf-accent-soft)] text-[var(--sf-accent)]"
                      : "border-black/10 text-[var(--sf-ink)]/60",
                  )}
                >
                  {toPersianDigits(value)}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
