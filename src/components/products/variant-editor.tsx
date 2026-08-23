"use client";

import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { computeFinalPrice, hasDiscount } from "@/lib/utils/pricing";
import { formatToman } from "@/lib/utils/format";

export interface VariantAttributeForm {
  name: string;
  value: string;
}

export interface VariantForm {
  id: string; // client-side key only, not sent for new variants
  unit: string;
  attributes: VariantAttributeForm[];
  sku: string;
  price: string; // kept as string while editing, parsed on submit
  discountPercent: string;
  discountAmount: string;
  stock: string;
  isActive: boolean;
}

export function createEmptyVariant(): VariantForm {
  return {
    id: crypto.randomUUID(),
    unit: "",
    attributes: [],
    sku: "",
    price: "",
    discountPercent: "0",
    discountAmount: "0",
    stock: "0",
    isActive: true,
  };
}

const UNIT_SUGGESTIONS = ["تخته", "عدد", "جفت", "متر", "متر مربع"];

export function VariantEditor({
  variants,
  onChange,
}: {
  variants: VariantForm[];
  onChange: (variants: VariantForm[]) => void;
}) {
  function updateVariant(id: string, patch: Partial<VariantForm>) {
    onChange(variants.map((v) => (v.id === id ? { ...v, ...patch } : v)));
  }

  function removeVariant(id: string) {
    onChange(variants.filter((v) => v.id !== id));
  }

  function addAttribute(variantId: string) {
    updateVariant(variantId, {
      attributes: [
        ...(variants.find((v) => v.id === variantId)?.attributes ?? []),
        { name: "", value: "" },
      ],
    });
  }

  function updateAttribute(
    variantId: string,
    index: number,
    patch: Partial<VariantAttributeForm>,
  ) {
    const variant = variants.find((v) => v.id === variantId);
    if (!variant) return;
    const nextAttrs = variant.attributes.map((a, i) =>
      i === index ? { ...a, ...patch } : a,
    );
    updateVariant(variantId, { attributes: nextAttrs });
  }

  function removeAttribute(variantId: string, index: number) {
    const variant = variants.find((v) => v.id === variantId);
    if (!variant) return;
    updateVariant(variantId, {
      attributes: variant.attributes.filter((_, i) => i !== index),
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {variants.map((variant, index) => {
        const price = Number(variant.price) || 0;
        const discountPercent = Number(variant.discountPercent) || 0;
        const discountAmount = Number(variant.discountAmount) || 0;
        const finalPrice = computeFinalPrice(
          price,
          discountPercent,
          discountAmount,
        );

        return (
          <div
            key={variant.id}
            className="rounded-[var(--radius-md)] border border-border p-4"
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-medium text-muted">
                Variant #{index + 1}
              </span>
              {variants.length > 1 ? (
                <button
                  type="button"
                  onClick={() => removeVariant(variant.id)}
                  className="flex size-7 items-center justify-center rounded-[var(--radius-sm)] text-danger hover:bg-red-50"
                  aria-label="حذف Variant"
                >
                  <Trash2 className="size-4" />
                </button>
              ) : null}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-foreground/80">
                  واحد فروش
                </label>
                <Input
                  list={`unit-suggestions-${variant.id}`}
                  value={variant.unit}
                  onChange={(e) =>
                    updateVariant(variant.id, { unit: e.target.value })
                  }
                  placeholder="مثلاً متر مربع"
                />
                <datalist id={`unit-suggestions-${variant.id}`}>
                  {UNIT_SUGGESTIONS.map((u) => (
                    <option key={u} value={u} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-foreground/80">
                  کد محصول (SKU) — اختیاری
                </label>
                <Input
                  dir="ltr"
                  value={variant.sku}
                  onChange={(e) =>
                    updateVariant(variant.id, { sku: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-foreground/80">
                  قیمت پایه (تومان)
                </label>
                <Input
                  type="number"
                  min={0}
                  dir="ltr"
                  value={variant.price}
                  onChange={(e) =>
                    updateVariant(variant.id, { price: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-foreground/80">
                  موجودی
                </label>
                <Input
                  type="number"
                  min={0}
                  dir="ltr"
                  value={variant.stock}
                  onChange={(e) =>
                    updateVariant(variant.id, { stock: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-foreground/80">
                  تخفیف درصدی (٪)
                </label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  dir="ltr"
                  value={variant.discountPercent}
                  onChange={(e) =>
                    updateVariant(variant.id, {
                      discountPercent: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-foreground/80">
                  تخفیف مبلغ ثابت (تومان)
                </label>
                <Input
                  type="number"
                  min={0}
                  dir="ltr"
                  value={variant.discountAmount}
                  onChange={(e) =>
                    updateVariant(variant.id, {
                      discountAmount: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            {price > 0 ? (
              <p className="mt-2 text-xs text-muted">
                قیمت نهایی:{" "}
                <span className="font-medium text-foreground">
                  {formatToman(finalPrice)}
                </span>
                {hasDiscount(discountPercent, discountAmount) ? (
                  <span className="mr-1 text-muted-foreground line-through">
                    {formatToman(price)}
                  </span>
                ) : null}
              </p>
            ) : null}

            <div className="mt-3 border-t border-dashed border-border pt-3">
              <p className="mb-2 text-xs font-medium text-foreground/80">
                ویژگی‌ها (رنگ، اندازه، شانه، تراکم و ...)
              </p>
              <div className="flex flex-col gap-2">
                {variant.attributes.map((attr, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input
                      placeholder="نام ویژگی (مثلاً رنگ)"
                      value={attr.name}
                      onChange={(e) =>
                        updateAttribute(variant.id, i, { name: e.target.value })
                      }
                    />
                    <Input
                      placeholder="مقدار (مثلاً قرمز)"
                      value={attr.value}
                      onChange={(e) =>
                        updateAttribute(variant.id, i, { value: e.target.value })
                      }
                    />
                    <button
                      type="button"
                      onClick={() => removeAttribute(variant.id, i)}
                      className="flex size-9 shrink-0 items-center justify-center rounded-[var(--radius-sm)] text-danger hover:bg-red-50"
                      aria-label="حذف ویژگی"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => addAttribute(variant.id)}
                className="mt-2 flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <Plus className="size-3.5" />
                افزودن ویژگی
              </button>
            </div>
          </div>
        );
      })}

      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => onChange([...variants, createEmptyVariant()])}
        className="self-start"
      >
        <Plus className="size-4" />
        افزودن Variant
      </Button>
    </div>
  );
}
