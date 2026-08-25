"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Sparkles } from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";
import { Button } from "@/components/ui/button";
import { formatToman, toPersianDigits } from "@/lib/utils/format";
import {
  computeAmazingOfferPrice,
  DEFAULT_AMAZING_OFFER_DURATION_MS,
} from "@/lib/utils/amazing-offer";
import type { AmazingOfferDiscountType } from "@/models/AmazingOffer";

interface SearchedProduct {
  id: string;
  title: string;
}

interface ProductVariantDetail {
  id: string;
  unit: string;
  attributes: Array<{ name: string; value: string }>;
  price: number;
  stock: number;
  isActive: boolean;
}

interface EditInitial {
  id: string;
  productTitle: string;
  variantLabel: string;
  discountType: AmazingOfferDiscountType;
  discountValue: number;
  startAt: string;
  endAt: string;
  isActive: boolean;
  basePrice: number;
}

/** Formats a Date as the value a `datetime-local` input expects (local time, no timezone). */
function toLocalInputValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

export function AmazingOfferForm({
  mode,
  initial,
}: {
  mode: "create" | "edit";
  initial?: EditInitial;
}) {
  const router = useRouter();

  // --- product/variant selection (create mode only) ---
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchedProduct[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<SearchedProduct | null>(null);
  const [variants, setVariants] = useState<ProductVariantDetail[]>([]);
  const [selectedVariantId, setSelectedVariantId] = useState("");

  const [discountType, setDiscountType] = useState<AmazingOfferDiscountType>(
    initial?.discountType ?? "percent",
  );
  const [discountValue, setDiscountValue] = useState(String(initial?.discountValue ?? "20"));
  const [startAt, setStartAt] = useState(() =>
    initial ? toLocalInputValue(new Date(initial.startAt)) : toLocalInputValue(new Date()),
  );
  const [endAt, setEndAt] = useState(() =>
    initial
      ? toLocalInputValue(new Date(initial.endAt))
      : toLocalInputValue(new Date(Date.now() + DEFAULT_AMAZING_OFFER_DURATION_MS)),
  );
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (mode !== "create" || !query.trim()) {
      const timeout = setTimeout(() => setResults([]), 0);
      return () => clearTimeout(timeout);
    }
    const timeout = setTimeout(() => {
      fetch(`/api/v1/products?search=${encodeURIComponent(query)}&limit=5&status=published`)
        .then((res) => res.json())
        .then((body) => {
          if (body.success) setResults(body.data);
        })
        .catch(() => setResults([]));
    }, 350);
    return () => clearTimeout(timeout);
  }, [query, mode]);

  function selectProduct(product: SearchedProduct) {
    setSelectedProduct(product);
    setQuery("");
    setResults([]);
    setSelectedVariantId("");
    fetch(`/api/v1/products/${product.id}`)
      .then((res) => res.json())
      .then((body) => {
        if (body.success) setVariants(body.data.variants);
      });
  }

  const selectedVariant = variants.find((v) => v.id === selectedVariantId);
  const basePrice = selectedVariant?.price ?? initial?.basePrice ?? 0;
  const previewPrice = computeAmazingOfferPrice(
    basePrice,
    discountType,
    Number(discountValue) || 0,
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (mode === "create" && (!selectedProduct || !selectedVariantId)) {
      setError("یک محصول و Variant انتخاب کنید");
      return;
    }
    if (new Date(endAt).getTime() <= new Date(startAt).getTime()) {
      setError("زمان پایان باید بعد از زمان شروع باشد");
      return;
    }

    setSaving(true);
    try {
      const body =
        mode === "create"
          ? {
              productId: selectedProduct!.id,
              variantId: selectedVariantId,
              discountType,
              discountValue: Number(discountValue) || 0,
              startAt: new Date(startAt).toISOString(),
              endAt: new Date(endAt).toISOString(),
            }
          : {
              discountType,
              discountValue: Number(discountValue) || 0,
              startAt: new Date(startAt).toISOString(),
              endAt: new Date(endAt).toISOString(),
              isActive,
            };

      const res = await fetch(
        mode === "create" ? "/api/v1/amazing-offers" : `/api/v1/amazing-offers/${initial!.id}`,
        {
          method: mode === "create" ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      const resBody = await res.json();
      if (!res.ok || !resBody.success) {
        setError(resBody.message ?? "خطا در ثبت تخفیف شگفت‌انگیز");
        return;
      }
      router.push("/dashboard/amazing-offers");
      router.refresh();
    } catch {
      setError("ارتباط با سرور برقرار نشد");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Card>
        <CardHeader
          title="محصول و Variant"
          action={<Sparkles className="size-4 text-primary" />}
        />
        <CardContent className="flex flex-col gap-3">
          {mode === "edit" ? (
            <p className="text-sm text-foreground">
              {initial!.productTitle}
              <span className="text-muted"> · {initial!.variantLabel}</span>
            </p>
          ) : !selectedProduct ? (
            <div className="relative">
              <Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="جستجوی محصول..."
                className="pr-9"
              />
              {results.length > 0 ? (
                <ul className="absolute z-10 mt-1.5 w-full overflow-hidden rounded-[var(--radius-md)] border border-border bg-surface shadow-lg">
                  {results.map((p) => (
                    <li key={p.id}>
                      <button
                        type="button"
                        onClick={() => selectProduct(p)}
                        className="w-full px-3 py-2.5 text-right text-sm hover:bg-surface-subtle"
                      >
                        {p.title}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">
                  {selectedProduct.title}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedProduct(null);
                    setVariants([]);
                    setSelectedVariantId("");
                  }}
                  className="text-xs text-muted hover:text-foreground"
                >
                  تغییر محصول
                </button>
              </div>
              {variants.length === 0 ? (
                <p className="text-xs text-muted">در حال بارگذاری Variantها...</p>
              ) : (
                <Combobox
                  value={selectedVariantId}
                  onChange={setSelectedVariantId}
                  placeholder="انتخاب Variant"
                  options={variants
                    .filter((v) => v.isActive)
                    .map((v) => {
                      const attrsText = v.attributes.map((a) => a.value).join("، ");
                      const label = [v.unit, attrsText, formatToman(v.price)]
                        .filter(Boolean)
                        .join(" · ");
                      return {
                        value: v.id,
                        label: `${label} (موجودی: ${toPersianDigits(v.stock)})`,
                        disabled: v.stock === 0,
                      };
                    })}
                />
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="تخفیف و زمان‌بندی" />
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted">نوع تخفیف</label>
              <Combobox
                value={discountType}
                onChange={(v) => setDiscountType(v as AmazingOfferDiscountType)}
                options={[
                  { value: "percent", label: "درصدی" },
                  { value: "fixed", label: "مبلغ ثابت (تومان)" },
                ]}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted">
                {discountType === "percent" ? "درصد تخفیف" : "مبلغ تخفیف (تومان)"}
              </label>
              <Input
                type="number"
                dir="ltr"
                min={0}
                max={discountType === "percent" ? 100 : undefined}
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted">شروع</label>
              <Input
                type="datetime-local"
                dir="ltr"
                value={startAt}
                onChange={(e) => setStartAt(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted">پایان</label>
              <Input
                type="datetime-local"
                dir="ltr"
                value={endAt}
                onChange={(e) => setEndAt(e.target.value)}
              />
            </div>
          </div>

          {mode === "edit" ? (
            <label className="flex w-fit items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="size-4 rounded border-border"
              />
              فعال (خاموش کردن این گزینه، Offer را بدون توجه به زمان‌بندی متوقف می‌کند)
            </label>
          ) : null}

          {basePrice > 0 ? (
            <div className="rounded-[var(--radius-md)] border border-dashed border-border-strong p-3 text-sm">
              قیمت اصلی: <span className="text-muted line-through">{formatToman(basePrice)}</span>
              {" · "}
              قیمت نهایی: <span className="font-medium text-primary">{formatToman(previewPrice)}</span>
            </div>
          ) : null}

          {error ? <p className="text-sm text-danger">{error}</p> : null}

          <div className="flex justify-end gap-2">
            <Button type="submit" disabled={saving}>
              {saving ? "در حال ثبت..." : mode === "create" ? "ثبت تخفیف شگفت‌انگیز" : "ذخیره تغییرات"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
