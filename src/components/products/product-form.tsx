"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ProductImageUploader,
  type ProductImage,
} from "@/components/products/product-image-uploader";
import {
  VariantEditor,
  createEmptyVariant,
  type VariantForm,
} from "@/components/products/variant-editor";
import {
  TechnicalSpecsEditor,
  type TechSpecForm,
} from "@/components/products/technical-specs-editor";
import { slugify } from "@/lib/utils/slugify";
import type { ProductStatus } from "@/models/Product";

interface CategoryOption {
  id: string;
  name: string;
  parentId: string | null;
}

export interface ProductFormInitial {
  id: string;
  title: string;
  slug: string;
  description: string;
  technicalDescription: string;
  technicalSpecifications: TechSpecForm[];
  category: string;
  images: ProductImage[];
  variants: Array<Omit<VariantForm, "id" | "price" | "discountPercent" | "discountAmount" | "stock"> & {
    id: string;
    price: number;
    discountPercent: number;
    discountAmount: number;
    stock: number;
  }>;
  status: ProductStatus;
  seo: { title?: string; description?: string };
}

const statusOptions: Array<{ value: ProductStatus; label: string }> = [
  { value: "draft", label: "پیش‌نویس" },
  { value: "published", label: "منتشرشده" },
  { value: "archived", label: "بایگانی‌شده" },
];

export function ProductForm({
  mode,
  initial,
}: {
  mode: "create" | "edit";
  initial?: ProductFormInitial;
}) {
  const router = useRouter();

  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(initial));
  const [description, setDescription] = useState(initial?.description ?? "");
  const [technicalDescription, setTechnicalDescription] = useState(
    initial?.technicalDescription ?? "",
  );
  const [category, setCategory] = useState(initial?.category ?? "");
  const [images, setImages] = useState<ProductImage[]>(initial?.images ?? []);
  const [variants, setVariants] = useState<VariantForm[]>(
    initial?.variants.map((v) => ({
      ...v,
      price: String(v.price),
      discountPercent: String(v.discountPercent),
      discountAmount: String(v.discountAmount),
      stock: String(v.stock),
    })) ?? [createEmptyVariant()],
  );
  const [techSpecs, setTechSpecs] = useState<TechSpecForm[]>(
    initial?.technicalSpecifications ?? [],
  );
  const [status, setStatus] = useState<ProductStatus>(initial?.status ?? "draft");
  const [seoTitle, setSeoTitle] = useState(initial?.seo?.title ?? "");
  const [seoDescription, setSeoDescription] = useState(
    initial?.seo?.description ?? "",
  );

  const [categories, setCategories] = useState<CategoryOption[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/v1/categories")
      .then((res) => res.json())
      .then((body) => {
        if (body.success) setCategories(body.data);
      })
      .catch(() => setCategories([]));
  }, []);

  function handleTitleChange(value: string) {
    setTitle(value);
    if (!slugTouched) setSlug(slugify(value));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (title.trim().length < 2) {
      setError("عنوان محصول باید حداقل ۲ حرف باشد");
      return;
    }
    if (!/^[a-z0-9-]+$/.test(slug)) {
      setError("Slug فقط می‌تواند شامل حروف انگلیسی کوچک، عدد و خط تیره باشد");
      return;
    }
    if (!category) {
      setError("انتخاب دسته‌بندی الزامی است");
      return;
    }
    if (variants.length === 0) {
      setError("حداقل یک Variant لازم است");
      return;
    }
    for (const v of variants) {
      if (!v.unit.trim()) {
        setError("واحد فروش همه Variantها باید مشخص باشد");
        return;
      }
      if (!v.price || Number(v.price) < 0) {
        setError("قیمت همه Variantها باید معتبر باشد");
        return;
      }
    }

    setSaving(true);
    try {
      const payload = {
        title,
        slug,
        description,
        technicalDescription,
        technicalSpecifications: techSpecs.filter(
          (s) => s.key.trim() && s.value.trim(),
        ),
        category,
        images,
        variants: variants.map((v) => ({
          unit: v.unit,
          attributes: v.attributes.filter(
            (a) => a.name.trim() && a.value.trim(),
          ),
          sku: v.sku || undefined,
          price: Number(v.price) || 0,
          discountPercent: Number(v.discountPercent) || 0,
          discountAmount: Number(v.discountAmount) || 0,
          stock: Number(v.stock) || 0,
          isActive: v.isActive,
        })),
        status,
        seo: { title: seoTitle || undefined, description: seoDescription || undefined },
      };

      const url =
        mode === "create" ? "/api/v1/products" : `/api/v1/products/${initial!.id}`;
      const method = mode === "create" ? "POST" : "PATCH";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await res.json();

      if (!res.ok || !body.success) {
        setError(body.message ?? "خطایی رخ داد");
        return;
      }

      router.push("/dashboard/products");
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
        <CardHeader title="اطلاعات اصلی" />
        <CardContent className="flex flex-col gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-foreground/80">
              نام محصول
            </label>
            <Input
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="مثلاً فرش ماشینی طرح باستان ۱۲۰۰ شانه"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-foreground/80">
              Slug
            </label>
            <Input
              dir="ltr"
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
                setSlugTouched(true);
              }}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-foreground/80">
              دسته‌بندی
            </label>
            {categories === null ? (
              <Skeleton className="h-11 w-full" />
            ) : (
              <Select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">انتخاب کنید</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.parentId ? `⤷ ${c.name}` : c.name}
                  </option>
                ))}
              </Select>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-foreground/80">
              توضیحات
            </label>
            <Textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-foreground/80">
              توضیحات فنی
            </label>
            <Textarea
              rows={3}
              value={technicalDescription}
              onChange={(e) => setTechnicalDescription(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-foreground/80">
              وضعیت
            </label>
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value as ProductStatus)}
            >
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="تصاویر" description="حداکثر ۱۰ تصویر، نسبت ۳:۴" />
        <CardContent>
          <ProductImageUploader images={images} onChange={setImages} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader
          title="Variantها"
          description="واحد فروش، قیمت، تخفیف و موجودی هر حالت محصول"
        />
        <CardContent>
          <VariantEditor variants={variants} onChange={setVariants} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="ویژگی‌های فنی" />
        <CardContent>
          <TechnicalSpecsEditor specs={techSpecs} onChange={setTechSpecs} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="SEO" description="اختیاری" />
        <CardContent className="flex flex-col gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-foreground/80">
              عنوان SEO
            </label>
            <Input value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-foreground/80">
              توضیحات SEO
            </label>
            <Textarea
              rows={2}
              value={seoDescription}
              onChange={(e) => setSeoDescription(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {error ? (
        <div className="rounded-[var(--radius-md)] border border-red-200 bg-red-50 px-4 py-2.5 text-xs text-danger">
          {error}
        </div>
      ) : null}

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.push("/dashboard/products")}
        >
          انصراف
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? "در حال ذخیره..." : "ذخیره"}
        </Button>
      </div>
    </form>
  );
}
