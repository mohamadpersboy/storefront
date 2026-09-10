"use client";

import { useEffect, useState, useTransition } from "react";
import Image from "next/image";
import { GalleryHorizontal, Pencil, Plus, ArrowUp, ArrowDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BannerFormModal,
  type BannerFormValues,
} from "@/components/settings/banner-form-modal";

interface ApiBanner {
  id: string;
  title: string;
  subtitle: string | null;
  ctaLabel: string | null;
  href: string;
  imageUrl: string;
  imageBlurDataUrl: string | null;
  isActive: boolean;
  sortOrder: number;
}

export function BannersManager() {
  const [banners, setBanners] = useState<ApiBanner[]>([]);
  const [error, setError] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);
  const [loading, startTransition] = useTransition();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<BannerFormValues | undefined>();
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    startTransition(async () => {
      try {
        const res = await fetch("/api/v1/banners");
        const body = await res.json();
        if (!res.ok || !body.success) throw new Error(body.message);
        if (cancelled) return;
        setBanners(body.data);
        setError(false);
      } catch {
        if (!cancelled) setError(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  async function patchBanner(id: string, payload: Record<string, unknown>) {
    const res = await fetch(`/api/v1/banners/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = await res.json();
    return res.ok && body.success;
  }

  async function toggleActive(banner: ApiBanner) {
    setBusyId(banner.id);
    try {
      const ok = await patchBanner(banner.id, { isActive: !banner.isActive });
      if (ok) {
        setBanners((prev) =>
          prev.map((b) => (b.id === banner.id ? { ...b, isActive: !banner.isActive } : b)),
        );
      }
    } finally {
      setBusyId(null);
    }
  }

  async function move(banner: ApiBanner, direction: "up" | "down") {
    const index = banners.findIndex((b) => b.id === banner.id);
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= banners.length) return;
    const target = banners[targetIndex];

    setBusyId(banner.id);
    try {
      const [okA, okB] = await Promise.all([
        patchBanner(banner.id, { sortOrder: target.sortOrder }),
        patchBanner(target.id, { sortOrder: banner.sortOrder }),
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
          بنر جدید
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
        ) : banners.length === 0 ? (
          <EmptyState
            icon={GalleryHorizontal}
            title="هنوز بنری ثبت نشده"
            description="با دکمه «بنر جدید» اولین اسلاید Hero Slider صفحه اصلی فروشگاه را اضافه کنید."
          />
        ) : (
          <ul className="divide-y divide-border">
            {banners.map((banner, i) => (
              <li key={banner.id} className="flex items-center gap-3 px-5 py-3">
                <div className="relative aspect-[16/9] w-20 shrink-0 overflow-hidden rounded-[var(--radius-md)] border border-border bg-white">
                  <Image
                    src={banner.imageUrl}
                    alt={banner.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {banner.title}
                  </p>
                  <p className="truncate text-xs text-muted">{banner.href}</p>
                </div>
                <Badge tone={banner.isActive ? "success" : "neutral"}>
                  {banner.isActive ? "فعال" : "غیرفعال"}
                </Badge>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => move(banner, "up")}
                    disabled={busyId === banner.id || i === 0}
                    aria-label="جابه‌جایی به بالا"
                    className="flex size-8 items-center justify-center rounded-[var(--radius-sm)] text-muted hover:bg-surface-subtle disabled:opacity-30"
                  >
                    <ArrowUp className="size-4" />
                  </button>
                  <button
                    onClick={() => move(banner, "down")}
                    disabled={busyId === banner.id || i === banners.length - 1}
                    aria-label="جابه‌جایی به پایین"
                    className="flex size-8 items-center justify-center rounded-[var(--radius-sm)] text-muted hover:bg-surface-subtle disabled:opacity-30"
                  >
                    <ArrowDown className="size-4" />
                  </button>
                  <button
                    onClick={() => toggleActive(banner)}
                    disabled={busyId === banner.id}
                    className="rounded-[var(--radius-sm)] px-2 py-1 text-xs text-muted hover:bg-surface-subtle"
                  >
                    {banner.isActive ? "غیرفعال کردن" : "فعال کردن"}
                  </button>
                  <button
                    onClick={() => {
                      setEditing({
                        id: banner.id,
                        title: banner.title,
                        subtitle: banner.subtitle,
                        ctaLabel: banner.ctaLabel,
                        href: banner.href,
                        imageUrl: banner.imageUrl,
                        imageBlurDataUrl: banner.imageBlurDataUrl,
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
        <BannerFormModal
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
