"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { slugify } from "@/lib/utils/slugify";
import { initialMockCategories, type MockCategory } from "@/lib/mock/categories";

export function CategoryForm({
  mode,
  initial,
}: {
  mode: "create" | "edit";
  initial?: MockCategory;
}) {
  const router = useRouter();
  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(initial));
  const [parentId, setParentId] = useState(initial?.parentId ?? "");
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasChildren = initial
    ? initialMockCategories.some((c) => c.parentId === initial.id)
    : false;

  // Depth-2 rule: only top-level categories can be a parent, and the
  // category itself is excluded so it can't become its own parent.
  const parentOptions = initialMockCategories.filter(
    (c) => !c.parentId && c.id !== initial?.id,
  );

  function handleNameChange(value: string) {
    setName(value);
    if (!slugTouched) setSlug(slugify(value));
  }

  function handleSubmit(e: React.FormEvent) {
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
    // Mock-only: no real persistence yet — simulate the round-trip and
    // navigate back, per this phase's "No Fake Data" messaging.
    setTimeout(() => {
      router.push("/dashboard/categories");
    }, 400);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="rounded-[var(--radius-md)] border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-800">
        این فرم فعلاً چیزی را واقعاً ذخیره نمی‌کند (Mock) — در فاز
        Backend به API واقعی وصل می‌شود.
      </div>

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
            <Select
              value={parentId}
              disabled={hasChildren}
              onChange={(e) => setParentId(e.target.value)}
            >
              <option value="">بدون والد (دسته اصلی)</option>
              {parentOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
            {hasChildren ? (
              <p className="mt-1.5 text-xs text-muted">
                چون این دسته زیردسته دارد، نمی‌تواند زیرمجموعه دسته دیگری
                شود (حداکثر عمق مجاز ۲ سطح است).
              </p>
            ) : null}
          </div>

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
