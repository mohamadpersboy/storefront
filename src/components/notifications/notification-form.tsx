"use client";

import { useRef, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ImagePlus, Loader2, X } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";
import { Button } from "@/components/ui/button";
import { JalaliDatePicker } from "@/components/ui/jalali-date-picker";
import { ImageCropModal } from "@/components/products/image-crop-modal";
import { ADMIN_NOTIFICATION_TYPES } from "@/lib/notifications/constants";

// Tiptap فقط در مرورگر لود می‌شود (SSR-safe، بدون سنگین‌کردن Bundle اولیه).
const RichTextEditor = dynamic(() => import("@/components/notifications/rich-text-editor"), {
  ssr: false,
  loading: () => <div className="h-48 animate-pulse rounded-[var(--radius-sm)] border border-border bg-surface-subtle" />,
});

const TYPE_LABELS: Record<(typeof ADMIN_NOTIFICATION_TYPES)[number], string> = {
  announcement: "اطلاعیه",
  promotion: "تخفیف / کمپین",
  coupon: "کد تخفیف",
  special_offer: "پیشنهاد ویژه",
  system: "سیستمی",
};

export interface NotificationFormInitial {
  id: string;
  type: (typeof ADMIN_NOTIFICATION_TYPES)[number];
  title: string;
  content: string;
  imageUrl: string | null;
  link: string | null;
  status: "draft" | "published" | "archived";
  publishAt: string;
  expiresAt: string | null;
}

export function NotificationForm({ initial }: { initial?: NotificationFormInitial }) {
  const router = useRouter();
  const mode = initial ? "edit" : "create";
  const fileRef = useRef<HTMLInputElement>(null);

  const [type, setType] = useState(initial?.type ?? "announcement");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [content, setContent] = useState(initial?.content ?? "");
  const [imageUrl, setImageUrl] = useState<string | null>(initial?.imageUrl ?? null);
  const [link, setLink] = useState(initial?.link ?? "");
  const [publishAt, setPublishAt] = useState<string | null>(
    initial && initial.status !== "draft" ? initial.publishAt : null,
  );
  const [expiresAt, setExpiresAt] = useState<string | null>(initial?.expiresAt ?? null);

  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPendingImage(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handleCropped(blob: Blob) {
    setPendingImage(null);
    setUploading(true);
    setError(null);
    try {
      const signRes = await fetch("/api/v1/uploads/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target: "notification-image" }),
      });
      const signBody = await signRes.json();
      if (!signRes.ok || !signBody.success) throw new Error(signBody.message ?? "خطا در آماده‌سازی آپلود");
      const { timestamp, signature, apiKey, cloudName, folder } = signBody.data;

      const formData = new FormData();
      formData.append("file", blob);
      formData.append("api_key", apiKey);
      formData.append("timestamp", String(timestamp));
      formData.append("signature", signature);
      formData.append("folder", folder);

      const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: "POST",
        body: formData,
      });
      const uploadBody = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadBody.error?.message ?? "آپلود تصویر ناموفق بود");
      setImageUrl(uploadBody.secure_url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "آپلود تصویر ناموفق بود");
    } finally {
      setUploading(false);
    }
  }

  async function save(status: "draft" | "published" | "archived") {
    setError(null);
    if (title.trim().length < 2) {
      setError("عنوان الزامی است");
      return;
    }
    if (publishAt && expiresAt && new Date(publishAt) >= new Date(expiresAt)) {
      setError("زمان انقضا باید بعد از زمان انتشار باشد");
      return;
    }

    const body = {
      type,
      title,
      content,
      imageUrl,
      link: link.trim() || null,
      publishAt,
      expiresAt,
      status,
    };

    setSaving(true);
    try {
      const res = await fetch(
        mode === "create" ? "/api/v1/notifications/manage" : `/api/v1/notifications/manage/${initial!.id}`,
        {
          method: mode === "create" ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      const resBody = await res.json();
      if (!res.ok || !resBody.success) {
        const first = resBody.errors ? Object.values(resBody.errors as Record<string, string[]>)[0]?.[0] : null;
        setError(first ?? resBody.message ?? "خطا در ذخیره اعلان");
        return;
      }
      router.push("/dashboard/notifications");
      router.refresh();
    } catch {
      setError("ارتباط با سرور برقرار نشد");
    } finally {
      setSaving(false);
    }
  }

  const busy = saving || uploading;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void save(initial?.status === "archived" ? "archived" : (initial?.status ?? "draft"));
      }}
      className="flex flex-col gap-4"
    >
      <Card>
        <CardHeader title="محتوای اعلان" />
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="n-title" className="text-xs text-muted">عنوان</label>
              <Input id="n-title" value={title} maxLength={120} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted">نوع</label>
              <Combobox
                value={type}
                onChange={(v) => setType(v as typeof type)}
                options={ADMIN_NOTIFICATION_TYPES.map((t) => ({ value: t, label: TYPE_LABELS[t] }))}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-muted">متن</span>
            <RichTextEditor value={content} onChange={setContent} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="n-link" className="text-xs text-muted">لینک (اختیاری؛ مسیر داخلی مثل /categories یا آدرس https)</label>
            <Input id="n-link" dir="ltr" value={link} onChange={(e) => setLink(e.target.value)} placeholder="/categories" />
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-muted">تصویر (اختیاری)</span>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
            {imageUrl ? (
              <div className="flex items-center gap-3">
                <div className="relative aspect-video w-40 shrink-0 overflow-hidden rounded-[var(--radius-md)] border border-border">
                  <Image src={imageUrl} alt="تصویر اعلان" fill className="object-cover" />
                </div>
                <button type="button" onClick={() => setImageUrl(null)} className="flex items-center gap-1 text-xs text-danger">
                  <X className="size-3.5" />
                  حذف تصویر
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="flex aspect-video w-40 flex-col items-center justify-center gap-1 rounded-[var(--radius-md)] border border-dashed border-border-strong text-muted hover:bg-surface-subtle disabled:opacity-50"
              >
                {uploading ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}
                <span className="text-[10px]">{uploading ? "در حال آپلود..." : "افزودن تصویر"}</span>
              </button>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted">تاریخ شروع نمایش (خالی = هنگام انتشار)</label>
              <JalaliDatePicker value={publishAt} onChange={setPublishAt} allowEmpty />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted">تاریخ پایان نمایش (اختیاری)</label>
              <JalaliDatePicker value={expiresAt} onChange={setExpiresAt} allowEmpty />
            </div>
          </div>

          {error ? <p role="alert" className="text-sm text-danger">{error}</p> : null}

          <div className="flex flex-wrap justify-end gap-2">
            {initial?.status === "published" ? (
              <Button type="button" variant="secondary" disabled={busy} onClick={() => void save("archived")}>
                آرشیو (خارج از نمایش)
              </Button>
            ) : null}
            {initial?.status === "archived" ? (
              <Button type="button" variant="secondary" disabled={busy} onClick={() => void save("published")}>
                انتشار دوباره
              </Button>
            ) : null}
            {mode === "create" || initial?.status === "draft" ? (
              <>
                <Button type="button" variant="secondary" disabled={busy} onClick={() => void save("draft")}>
                  ذخیره پیش‌نویس
                </Button>
                <Button type="button" disabled={busy} onClick={() => void save("published")}>
                  انتشار
                </Button>
              </>
            ) : (
              <Button type="submit" disabled={busy}>
                {saving ? "در حال ذخیره..." : "ذخیره تغییرات"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {pendingImage ? (
        <ImageCropModal
          imageSrc={pendingImage}
          aspect={16 / 9}
          aspectLabel="۱۶:۹"
          onCancel={() => setPendingImage(null)}
          onCropped={handleCropped}
        />
      ) : null}
    </form>
  );
}
