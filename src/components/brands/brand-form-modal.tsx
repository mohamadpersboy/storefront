"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { slugify } from "@/lib/utils/slugify";
import {
  BrandImageUploader,
  type BrandImageValue,
} from "@/components/brands/brand-image-uploader";

export interface BrandFormValues {
  id?: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  imageBlurDataUrl: string | null;
  showOnHomepage: boolean;
}

/**
 * برند یک Entity کاملاً مستقل است (نه Variant، نه زیرمجموعه
 * Category) — همین‌جا هم فرمش کاملاً جدا از فرم دسته‌بندی/محصول
 * تعریف شده. تصویر مربعی + Cropper دقیقاً هم‌الگو با دسته‌بندی
 * (`BrandImageUploader` = کپی `CategoryImageUploader`)؛ ساختار
 * لیست/Toggle/سفارش‌گذاری هم‌الگو با `BannerFormModal`.
 */
export function BrandFormModal({
  initial,
  onCancel,
  onSaved,
}: {
  initial?: BrandFormValues;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(initial));
  const [image, setImage] = useState<BrandImageValue>({
    imageUrl: initial?.imageUrl ?? null,
    imagePublicId: null,
    imageBlurDataUrl: initial?.imageBlurDataUrl ?? null,
  });
  const [showOnHomepage, setShowOnHomepage] = useState(initial?.showOnHomepage ?? false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleNameChange(value: string) {
    setName(value);
    if (!slugTouched) setSlug(slugify(value));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (name.trim().length < 2) {
      setError("نام برند باید حداقل ۲ حرف باشد");
      return;
    }
    if (!/^[a-z0-9-]+$/.test(slug)) {
      setError("Slug فقط می‌تواند شامل حروف انگلیسی، عدد و خط تیره باشد");
      return;
    }

    setSaving(true);
    try {
      const url = initial?.id ? `/api/v1/brands/${initial.id}` : "/api/v1/brands";
      const method = initial?.id ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          slug,
          showOnHomepage,
          imageUrl: image.imageUrl,
          imagePublicId: image.imagePublicId,
          imageBlurDataUrl: image.imageBlurDataUrl,
        }),
      });
      const body = await res.json();

      if (!res.ok || !body.success) {
        setError(body.message ?? "خطایی رخ داد");
        return;
      }

      onSaved();
    } catch {
      setError("ارتباط با سرور برقرار نشد");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <form
        onSubmit={handleSubmit}
        className="relative flex max-h-[90vh] w-full max-w-md flex-col overflow-y-auto rounded-[var(--radius-lg)] border border-border bg-surface p-5"
      >
        <h2 className="mb-4 text-sm font-semibold text-foreground">
          {initial?.id ? "ویرایش برند" : "برند جدید"}
        </h2>

        <div className="flex flex-col gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-foreground/80">
              تصویر برند (مربعی)
            </label>
            <BrandImageUploader value={image} onChange={setImage} />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-foreground/80">نام</label>
            <Input
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="مثلاً کاشان"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-foreground/80">Slug</label>
            <Input
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(e.target.value);
              }}
              placeholder="kashan"
              dir="ltr"
            />
          </div>

          <label className="flex items-center gap-2 text-xs font-medium text-foreground/80">
            <input
              type="checkbox"
              checked={showOnHomepage}
              onChange={(e) => setShowOnHomepage(e.target.checked)}
              className="size-4 rounded border-border-strong"
            />
            نمایش در صفحه اصلی فروشگاه
          </label>

          {error ? <p className="text-xs text-danger">{error}</p> : null}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={onCancel} disabled={saving}>
            انصراف
          </Button>
          <Button type="submit" size="sm" disabled={saving}>
            {saving ? "در حال ذخیره..." : "ذخیره"}
          </Button>
        </div>
      </form>
    </div>
  );
}
