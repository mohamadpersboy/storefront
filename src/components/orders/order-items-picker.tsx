"use client";

import { useEffect, useState } from "react";
import { Plus, Search, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { formatToman, toPersianDigits } from "@/lib/utils/format";
import {
  Table,
  TableHeaderRow,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";

export interface OrderLineItem {
  productId: string;
  variantId: string;
  title: string;
  unit: string;
  colorName: string | null;
  attributesText: string;
  unitPrice: number;
  quantity: number;
  availableStock: number;
}

interface SearchedProduct {
  id: string;
  title: string;
}

interface ProductVariantDetail {
  id: string;
  unit: string;
  colorId: string | null;
  attributes: Array<{ name: string; value: string }>;
  price: number;
  discountPercent: number;
  discountAmount: number;
  stock: number;
  isActive: boolean;
}

export function OrderItemsPicker({
  items,
  onChange,
}: {
  items: OrderLineItem[];
  onChange: (items: OrderLineItem[]) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchedProduct[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<SearchedProduct | null>(null);
  const [variants, setVariants] = useState<ProductVariantDetail[]>([]);
  const [colorNames, setColorNames] = useState<Record<string, string>>({});
  const [selectedVariantId, setSelectedVariantId] = useState("");
  const [quantity, setQuantity] = useState("1");

  useEffect(() => {
    if (!query.trim()) {
      const timeout = setTimeout(() => setResults([]), 0);
      return () => clearTimeout(timeout);
    }
    const timeout = setTimeout(() => {
      fetch(`/api/v1/products?search=${encodeURIComponent(query)}&limit=5`)
        .then((res) => res.json())
        .then((body) => {
          if (body.success) setResults(body.data);
        })
        .catch(() => setResults([]));
    }, 350);
    return () => clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    fetch("/api/v1/colors")
      .then((res) => res.json())
      .then((body) => {
        if (body.success) {
          const map: Record<string, string> = {};
          for (const c of body.data) map[c.id] = c.name;
          setColorNames(map);
        }
      })
      .catch(() => {});
  }, []);

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

  function handleAdd() {
    const variant = variants.find((v) => v.id === selectedVariantId);
    if (!selectedProduct || !variant) return;
    const qty = Math.max(1, Number(quantity) || 1);

    const unitPrice = Math.max(
      0,
      Math.round(
        variant.price -
          (variant.price * variant.discountPercent) / 100 -
          variant.discountAmount,
      ),
    );

    onChange([
      ...items,
      {
        productId: selectedProduct.id,
        variantId: variant.id,
        title: selectedProduct.title,
        unit: variant.unit,
        colorName: variant.colorId ? (colorNames[variant.colorId] ?? null) : null,
        attributesText: variant.attributes.map((a) => `${a.name}: ${a.value}`).join("، "),
        unitPrice,
        quantity: qty,
        availableStock: variant.stock,
      },
    ]);

    setSelectedProduct(null);
    setVariants([]);
    setSelectedVariantId("");
    setQuantity("1");
  }

  function removeItem(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }

  const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);

  return (
    <div className="flex flex-col gap-4">
      {items.length > 0 ? (
        <div className="sm:overflow-hidden sm:rounded-[var(--radius-md)] sm:border sm:border-border">
          <Table>
            <TableHeaderRow>
              <TableHead className="px-3 py-2">محصول</TableHead>
              <TableHead className="px-3 py-2">مشخصات</TableHead>
              <TableHead className="px-3 py-2">تعداد</TableHead>
              <TableHead className="px-3 py-2">قیمت واحد</TableHead>
              <TableHead className="px-3 py-2">جمع</TableHead>
              <TableHead className="px-3 py-2"></TableHead>
            </TableHeaderRow>
            <TableBody>
              {items.map((item, i) => (
                <TableRow key={i}>
                  <TableCell mobileVariant="title" className="px-3 py-2 font-medium text-foreground">
                    {item.title}
                  </TableCell>
                  <TableCell label="مشخصات" className="px-3 py-2 text-xs text-muted">
                    {item.unit}
                    {item.colorName ? ` · ${item.colorName}` : ""}
                    {item.attributesText ? ` · ${item.attributesText}` : ""}
                  </TableCell>
                  <TableCell label="تعداد" className="px-3 py-2 tabular-nums">
                    {toPersianDigits(item.quantity)}
                  </TableCell>
                  <TableCell label="قیمت واحد" className="px-3 py-2 tabular-nums">
                    {formatToman(item.unitPrice)}
                  </TableCell>
                  <TableCell label="جمع" className="px-3 py-2 tabular-nums font-medium">
                    {formatToman(item.unitPrice * item.quantity)}
                  </TableCell>
                  <TableCell mobileVariant="actions" className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() => removeItem(i)}
                      className="mx-auto flex size-7 items-center justify-center rounded-[var(--radius-sm)] text-danger hover:bg-red-50"
                      aria-label="حذف قلم"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="mt-3 border-t border-border px-3 py-2 text-left text-sm sm:mt-0">
            جمع اقلام: <span className="font-medium">{formatToman(subtotal)}</span>
          </div>
        </div>
      ) : null}

      <div className="rounded-[var(--radius-md)] border border-dashed border-border-strong p-4">
        {!selectedProduct ? (
          <div className="relative">
            <Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="جستجوی محصول برای افزودن به سفارش..."
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
                }}
                className="text-xs text-muted hover:text-foreground"
              >
                تغییر محصول
              </button>
            </div>

            {variants.length === 0 ? (
              <p className="text-xs text-muted">در حال بارگذاری Variantها...</p>
            ) : (
              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="flex-1">
                  <Combobox
                    value={selectedVariantId}
                    onChange={setSelectedVariantId}
                    placeholder="انتخاب Variant"
                    options={variants
                      .filter((v) => v.isActive)
                      .map((v) => {
                        const finalPrice = Math.max(
                          0,
                          Math.round(
                            v.price -
                              (v.price * v.discountPercent) / 100 -
                              v.discountAmount,
                          ),
                        );
                        const attrsText = v.attributes
                          .map((a) => a.value)
                          .join("، ");
                        const colorText = v.colorId ? colorNames[v.colorId] : "";
                        const label = [v.unit, colorText, attrsText, formatToman(finalPrice)]
                          .filter(Boolean)
                          .join(" · ");
                        return {
                          value: v.id,
                          label: `${label} (موجودی: ${toPersianDigits(v.stock)})`,
                          disabled: v.stock === 0,
                        };
                      })}
                  />
                </div>
                <Input
                  type="number"
                  min={1}
                  dir="ltr"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="sm:w-24"
                />
                <Button
                  type="button"
                  size="sm"
                  disabled={!selectedVariantId}
                  onClick={handleAdd}
                >
                  <Plus className="size-4" />
                  افزودن
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
