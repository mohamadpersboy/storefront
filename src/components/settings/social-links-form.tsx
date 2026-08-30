"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

type Platform = "instagram" | "telegram" | "whatsapp" | "rubika" | "eitaa";

interface SocialLink {
  platform: Platform;
  url: string;
  isActive: boolean;
}

const PLATFORM_LABELS: Record<Platform, string> = {
  instagram: "اینستاگرام",
  telegram: "تلگرام",
  whatsapp: "واتساپ بیزینس",
  rubika: "روبیکا",
  eitaa: "ایتا",
};

export function SocialLinksForm() {
  const [links, setLinks] = useState<SocialLink[] | null>(null);
  const [errors, setErrors] = useState<Record<number, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/v1/social-links")
      .then((res) => res.json())
      .then((body) => {
        if (body.success) setLinks(body.data.links);
        else setError(body.message ?? "خطا در دریافت تنظیمات");
      })
      .catch(() => setError("ارتباط با سرور برقرار نشد"));
  }, []);

  function updateLink(index: number, patch: Partial<SocialLink>) {
    if (!links) return;
    setLinks(links.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!links) return;
    setSaving(true);
    setError(null);
    setErrors({});
    try {
      const res = await fetch("/api/v1/social-links", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ links }),
      });
      const body = await res.json();
      if (!res.ok || !body.success) {
        setError(body.message ?? "خطا در ذخیره تنظیمات");
        if (body.errors?.links) {
          // خطای Refine سطح آرایه (نه یک ایندکس خاص) — همان پیام کلی نمایش داده می‌شود
        }
        return;
      }
      setSavedAt(Date.now());
    } catch {
      setError("ارتباط با سرور برقرار نشد");
    } finally {
      setSaving(false);
    }
  }

  if (!links) {
    return (
      <Card>
        <CardContent className="flex flex-col gap-3 p-5">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Card>
        <CardHeader
          title="لینک شبکه‌های اجتماعی"
          description="این لینک‌ها در فوتر فروشگاه (Storefront) نمایش داده می‌شوند"
        />
        <CardContent className="flex flex-col gap-4">
          {links.map((link, index) => (
            <div key={link.platform} className="flex flex-col gap-1.5 border-b border-border pb-4 last:border-0 last:pb-0">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">
                  {PLATFORM_LABELS[link.platform]}
                </label>
                <label className="flex items-center gap-2 text-xs text-muted">
                  <input
                    type="checkbox"
                    checked={link.isActive}
                    onChange={(e) => updateLink(index, { isActive: e.target.checked })}
                    className="size-4 rounded border-border"
                  />
                  فعال
                </label>
              </div>
              <Input
                dir="ltr"
                placeholder="https://..."
                value={link.url}
                onChange={(e) => updateLink(index, { url: e.target.value })}
              />
              {errors[index] ? (
                <p className="text-xs text-danger">{errors[index]}</p>
              ) : null}
            </div>
          ))}
        </CardContent>
      </Card>

      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {savedAt ? <p className="text-sm text-green-700">تنظیمات ذخیره شد.</p> : null}

      <div className="flex justify-end">
        <Button type="submit" disabled={saving}>
          {saving ? "در حال ذخیره..." : "ذخیره تنظیمات"}
        </Button>
      </div>
    </form>
  );
}
