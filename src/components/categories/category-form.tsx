"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { slugify } from "@/lib/utils/slugify";
import {
  CategoryImageUploader,
  type CategoryImageValue,
} from "@/components/categories/category-image-uploader";
import type { ApiCategory } from "@/components/categories/categories-tree";

export interface CategoryFormInitial {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  isActive: boolean;
  sortOrder?: number;
  imageUrl?: string | null;
  imageBlurDataUrl?: string | null;
  showOnHomepage?: boolean;
}

export function CategoryForm({
  mode,
  initial,
}: {
  mode: "create" | "edit";
  initial?: CategoryFormInitial;
}) {
  const router = useRouter();
  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(initial));
  const [parentId, setParentId] = useState(initial?.parentId ?? "");
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [image, setImage] = useState<CategoryImageValue>({
    imageUrl: initial?.imageUrl ?? null,
    imagePublicId: null,
    imageBlurDataUrl: initial?.imageBlurDataUrl ?? null,
  });
  const [showOnHomepage, setShowOnHomepage] = useState(initial?.showOnHomepage ?? false);
  const [sortOrder, setSortOrder] = useState(initial?.sortOrder ?? 0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isRootCategory = parentId === "";

  const [allCategories, setAllCategories] = useState<ApiCategory[] | null>(null);
  const [hasChildren, setHasChildren] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/v1/categories")
      .then((res) => res.json())
      .then((body) => {
        if (cancelled || !body.success) return;
        const all: ApiCategory[] = body.data;
        setAllCategories(all);
        if (initial) {
          setHasChildren(all.some((c) => c.parentId === initial.id));
        }
      })
      .catch(() => {
        if (!cancelled) setAllCategories([]);
      });
    return () => {
      cancelled = true;
    };
  }, [initial]);

  // Depth-2 rule at the UI layer too: only top-level categories can be
  // a parent, and the category itself is excluded from its own options.
  const parentOptions = (allCategories ?? []).filter(
    (c) => !c.parentId && c.id !== initial?.id,
  );

  function handleNameChange(value: string) {
    setName(value);
    if (!slugTouched) setSlug(slugify(value));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (name.trim().length < 2) {
      setError("نام دسته‌بندی باید حداقل ۲ حرف باشد");
      return;
    }
    if (!/^[a-z0-9-]+$/.test(slug)) {
      setError("Slug فقط می‌تواند شامل حروف انگلیسی کوچک، عدد و خط تیره باشد");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name,
        slug,
        parentId: parentId || null,
        isActive,
        ...(isRootCategory
          ? {
              imageUrl: image.imageUrl,
              ...(image.imagePublicId ? { imagePublicId: image.imagePublicId } : {}),
              imageBlurDataUrl: image.imageBlurDataUrl,
              showOnHomepage,
              sortOrder,
            }
          : {}),
      };
      const url =
        mode === "create"
          ? "/api/v1/categories"
          : `/api/v1/categories/${initial!.id}`;
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

      router.push("/dashboard/categories");
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
          title={mode === "create" ? "دسته‌بندی جدید" : "ویرایش دسته‌بندی"}
        />
        <CardContent className="flex flex-col gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-foreground/80">
              نام دسته‌بندی
            </label>
            <Input
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="مثلاً فرش ماشینی"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-foreground/80">
              Slug (برای آدرس صفحه)
            </label>
            <Input
              dir="ltr"
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
                setSlugTouched(true);
              }}
              placeholder="farsh-mashini"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-foreground/80">
              دسته‌بندی والد (اختیاری)
            </label>
            {allCategories === null ? (
              <Skeleton className="h-11 w-full" />
            ) : (
              <Combobox
                value={parentId}
                disabled={hasChildren}
                onChange={setParentId}
                placeholder="بدون والد (دسته اصلی)"
                options={[
                  { value: "", label: "بدون والد (دسته اصلی)" },
                  ...parentOptions.map((c) => ({ value: c.id, label: c.name })),
                ]}
              />
            )}
            {hasChildren ? (
              <p className="mt-1.5 text-xs text-muted">
                چون این دسته زیردسته دارد، نمی‌تواند زیرمجموعه دسته دیگری
                شود (حداکثر عمق مجاز ۲ سطح است).
              </p>
            ) : null}
          </div>

          {isRootCategory ? (
            <>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-foreground/80">
                  تصویر دسته‌بندی (اختیاری، مربعی — فقط برای دسته‌بندی سطح اول)
                </label>
                <CategoryImageUploader value={image} onChange={setImage} />
              </div>

              <label className="flex items-center gap-2 text-sm text-foreground/80">
                <input
                  type="checkbox"
                  checked={showOnHomepage}
                  onChange={(e) => setShowOnHomepage(e.target.checked)}
                  className="size-4 rounded border-border accent-primary"
                />
                نمایش در صفحه اصلی فروشگاه (فقط دسته‌بندی سطح اول)
              </label>

              {showOnHomepage ? (
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-foreground/80">
                    اولویت نمایش در صفحه اصلی
                  </label>
                  <Input
                    type="number"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(Number(e.target.value) || 0)}
                    className="max-w-32"
                  />
                  <p className="mt-1 text-xs text-muted">
                    عدد کوچک‌تر زودتر (سمت راست‌تر) در ردیف دسته‌بندی‌های
                    صفحه اصلی نمایش داده می‌شود.
                  </p>
                </div>
              ) : null}
            </>
          ) : null}

          <label className="flex items-center gap-2 text-sm text-foreground/80">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="size-4 rounded border-border accent-primary"
            />
            فعال (در فروشگاه نمایش داده شود)
          </label>

          {error ? <p className="text-xs text-danger">{error}</p> : null}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.push("/dashboard/categories")}
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
