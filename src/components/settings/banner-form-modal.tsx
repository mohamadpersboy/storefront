"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ImagePlus, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { buildBlurDataUrl } from "@/lib/utils/build-blur-data-url";

export interface BannerFormValues {
  id?: string;
  title: string;
  subtitle: string | null;
  ctaLabel: string | null;
  href: string;
  imageUrl: string;
  imageBlurDataUrl: string | null;
}

export function BannerFormModal({
  initial,
  onCancel,
  onSaved,
}: {
  initial?: BannerFormValues;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [subtitle, setSubtitle] = useState(initial?.subtitle ?? "");
  const [ctaLabel, setCtaLabel] = useState(initial?.ctaLabel ?? "");
  const [href, setHref] = useState(initial?.href ?? "");
  const [imageUrl, setImageUrl] = useState<string | null>(initial?.imageUrl ?? null);
  const [imagePublicId, setImagePublicId] = useState<string | null>(null);
  const [imageBlurDataUrl, setImageBlurDataUrl] = useState<string | null>(
    initial?.imageBlurDataUrl ?? null,
  );
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setUploading(true);
    setError(null);
    try {
      const signRes = await fetch("/api/v1/uploads/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target: "banner-image" }),
      });
      const signBody = await signRes.json();
      if (!signRes.ok || !signBody.success) {
        throw new Error(signBody.message ?? "خطا در آماده‌سازی آپلود");
      }
      const { timestamp, signature, apiKey, cloudName, folder } = signBody.data;

      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", apiKey);
      formData.append("timestamp", String(timestamp));
      formData.append("signature", signature);
      formData.append("folder", folder);

      const uploadRes = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        { method: "POST", body: formData },
      );
      const uploadBody = await uploadRes.json();
      if (!uploadRes.ok) {
        throw new Error(uploadBody.error?.message ?? "آپلود تصویر ناموفق بود");
      }

      setImageUrl(uploadBody.secure_url);
      setImagePublicId(uploadBody.public_id);
      const blurDataUrl = await buildBlurDataUrl(uploadBody.secure_url);
      setImageBlurDataUrl(blurDataUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "آپلود تصویر ناموفق بود");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (title.trim().length < 2) {
      setError("عنوان باید حداقل ۲ حرف باشد");
      return;
    }
    if (!href.trim()) {
      setError("لینک مقصد الزامی است");
      return;
    }
    if (!imageUrl) {
      setError("تصویر بنر الزامی است");
      return;
    }
    if (!initial?.id && !imagePublicId) {
      setError("آپلود تصویر هنوز کامل نشده");
      return;
    }

    setSaving(true);
    try {
      const url = initial?.id ? `/api/v1/banners/${initial.id}` : "/api/v1/banners";
      const method = initial?.id ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          subtitle: subtitle.trim() || null,
          ctaLabel: ctaLabel.trim() || null,
          href,
          ...(imagePublicId ? { imageUrl, imagePublicId, imageBlurDataUrl } : {}),
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
          {initial?.id ? "ویرایش بنر" : "بنر جدید"}
        </h2>

        <div className="flex flex-col gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-foreground/80">
              تصویر بنر (نسبت پیشنهادی ۱۶:۹ یا ۲۱:۹)
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />
            {imageUrl ? (
              <div className="flex items-center gap-3">
                <div className="relative aspect-[16/9] w-32 shrink-0 overflow-hidden rounded-[var(--radius-md)] border border-border bg-white">
                  <Image src={imageUrl} alt="تصویر بنر" fill className="object-cover" />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setImageUrl(null);
                    setImagePublicId(null);
                    setImageBlurDataUrl(null);
                  }}
                  className="flex items-center gap-1 text-xs text-danger"
                >
                  <X className="size-3.5" />
                  حذف تصویر
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex aspect-[16/9] w-32 items-center justify-center rounded-[var(--radius-md)] border border-dashed border-border text-muted hover:bg-surface-subtle"
              >
                {uploading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <ImagePlus className="size-4" />
                )}
              </button>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-foreground/80">
              عنوان
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثلاً جشنواره پاییزه فرش"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-foreground/80">
              توضیح کوتاه (اختیاری)
            </label>
            <Input
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="مثلاً تا ۳۰٪ تخفیف روی فرش‌های ماشینی"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-foreground/80">
              متن دکمه (اختیاری)
            </label>
            <Input
              value={ctaLabel}
              onChange={(e) => setCtaLabel(e.target.value)}
              placeholder="مثلاً مشاهده محصولات"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-foreground/80">
              لینک مقصد
            </label>
            <Input
              value={href}
              onChange={(e) => setHref(e.target.value)}
              placeholder="/categories/فرش-ماشینی"
              dir="ltr"
            />
          </div>

          {error ? <p className="text-xs text-danger">{error}</p> : null}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={onCancel} disabled={saving}>
            انصراف
          </Button>
          <Button type="submit" size="sm" disabled={saving || uploading}>
            {saving ? "در حال ذخیره..." : "ذخیره"}
          </Button>
        </div>
      </form>
    </div>
  );
}
