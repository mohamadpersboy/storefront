"use client";

import { useEffect, useState, useTransition } from "react";
import Image from "next/image";
import { Award, Pencil, Plus, ArrowUp, ArrowDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { BrandFormModal, type BrandFormValues } from "@/components/brands/brand-form-modal";

interface ApiBrand {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  imageBlurDataUrl: string | null;
  isActive: boolean;
  showOnHomepage: boolean;
  sortOrder: number;
}

/**
 * برند یک Entity کاملاً مستقل از Category است — لیست تخت (بدون
 * درخت)، دقیقاً هم‌الگو با `BannersManager` (Toggle فعال/غیرفعال +
 * جابه‌جایی دستی با `sortOrder`)، فقط با یک ستون اضافه برای وضعیت
 * «نمایش در صفحه اصلی».
 */
export function BrandsManager() {
  const [brands, setBrands] = useState<ApiBrand[]>([]);
  const [error, setError] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);
  const [loading, startTransition] = useTransition();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<BrandFormValues | undefined>();
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    startTransition(async () => {
      try {
        const res = await fetch("/api/v1/brands");
        const body = await res.json();
        if (!res.ok || !body.success) throw new Error(body.message);
        if (cancelled) return;
        setBrands(body.data);
        setError(false);
      } catch {
        if (!cancelled) setError(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  async function patchBrand(id: string, payload: Record<string, unknown>) {
    const res = await fetch(`/api/v1/brands/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = await res.json();
    return res.ok && body.success;
  }

  async function toggleActive(brand: ApiBrand) {
    setBusyId(brand.id);
    try {
      const ok = await patchBrand(brand.id, { isActive: !brand.isActive });
      if (ok) {
        setBrands((prev) =>
          prev.map((b) => (b.id === brand.id ? { ...b, isActive: !brand.isActive } : b)),
        );
      }
    } finally {
      setBusyId(null);
    }
  }

  async function move(brand: ApiBrand, direction: "up" | "down") {
    const index = brands.findIndex((b) => b.id === brand.id);
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= brands.length) return;
    const target = brands[targetIndex];

    setBusyId(brand.id);
    try {
      const [okA, okB] = await Promise.all([
        patchBrand(brand.id, { sortOrder: target.sortOrder }),
        patchBrand(target.id, { sortOrder: brand.sortOrder }),
      ]);
      if (okA && okB) {
        setReloadToken((t) => t + 1);
      }
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button
          size="sm"
          onClick={() => {
            setEditing(undefined);
            setFormOpen(true);
          }}
        >
          <Plus className="size-4" />
          برند جدید
        </Button>
      </div>

      <Card>
        {loading ? (
          <div className="p-5">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="mb-3 h-16 w-full last:mb-0" />
            ))}
          </div>
        ) : error ? (
          <ErrorState onRetry={() => setReloadToken((t) => t + 1)} />
        ) : brands.length === 0 ? (
          <EmptyState
            icon={Award}
            title="هنوز برندی ثبت نشده"
            description="با دکمه «برند جدید» اولین برند فروشگاه را اضافه کنید."
          />
        ) : (
          <ul className="divide-y divide-border">
            {brands.map((brand, i) => (
              <li key={brand.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 px-5 py-3">
                <div className="flex min-w-0 flex-1 items-center gap-3 basis-full sm:basis-auto">
                  <div className="relative aspect-square w-14 shrink-0 overflow-hidden rounded-[var(--radius-md)] border border-border bg-white">
                    {brand.imageUrl ? (
                      <Image
                        src={brand.imageUrl}
                        alt={brand.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center text-muted">
                        <Award className="size-5" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{brand.name}</p>
                    <p className="truncate text-xs text-muted" dir="ltr">
                      {brand.slug}
                    </p>
                  </div>
                </div>
                {brand.showOnHomepage ? <Badge tone="primary">صفحه اصلی</Badge> : null}
                <Badge tone={brand.isActive ? "success" : "neutral"}>
                  {brand.isActive ? "فعال" : "غیرفعال"}
                </Badge>
                <div className="mr-auto flex items-center gap-1 sm:mr-0">
                  <button
                    onClick={() => move(brand, "up")}
                    disabled={busyId === brand.id || i === 0}
                    aria-label="جابه‌جایی به بالا"
                    className="flex size-8 items-center justify-center rounded-[var(--radius-sm)] text-muted hover:bg-surface-subtle disabled:opacity-30"
                  >
                    <ArrowUp className="size-4" />
                  </button>
                  <button
                    onClick={() => move(brand, "down")}
                    disabled={busyId === brand.id || i === brands.length - 1}
                    aria-label="جابه‌جایی به پایین"
                    className="flex size-8 items-center justify-center rounded-[var(--radius-sm)] text-muted hover:bg-surface-subtle disabled:opacity-30"
                  >
                    <ArrowDown className="size-4" />
                  </button>
                  <button
                    onClick={() => toggleActive(brand)}
                    disabled={busyId === brand.id}
                    className="rounded-[var(--radius-sm)] px-2 py-1 text-xs text-muted hover:bg-surface-subtle"
                  >
                    {brand.isActive ? "غیرفعال کردن" : "فعال کردن"}
                  </button>
                  <button
                    onClick={() => {
                      setEditing({
                        id: brand.id,
                        name: brand.name,
                        slug: brand.slug,
                        imageUrl: brand.imageUrl,
                        imageBlurDataUrl: brand.imageBlurDataUrl,
                        showOnHomepage: brand.showOnHomepage,
                      });
                      setFormOpen(true);
                    }}
                    aria-label="ویرایش"
                    className="flex size-8 items-center justify-center rounded-[var(--radius-sm)] text-muted hover:bg-surface-subtle"
                  >
                    <Pencil className="size-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {formOpen ? (
        <BrandFormModal
          initial={editing}
          onCancel={() => setFormOpen(false)}
          onSaved={() => {
            setFormOpen(false);
            setReloadToken((t) => t + 1);
          }}
        />
      ) : null}
    </div>
  );
}
