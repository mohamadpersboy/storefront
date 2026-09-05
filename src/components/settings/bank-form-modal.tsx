"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ImagePlus, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface BankFormValues {
  id?: string;
  name: string;
  logoUrl: string | null;
}

export function BankFormModal({
  initial,
  onCancel,
  onSaved,
}: {
  initial?: BankFormValues;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [logoUrl, setLogoUrl] = useState<string | null>(initial?.logoUrl ?? null);
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
        body: JSON.stringify({ target: "bank-logo" }),
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
        throw new Error(uploadBody.error?.message ?? "آپلود لوگو ناموفق بود");
      }

      setLogoUrl(uploadBody.secure_url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "آپلود لوگو ناموفق بود");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (name.trim().length < 2) {
      setError("نام بانک باید حداقل ۲ حرف باشد");
      return;
    }

    setSaving(true);
    try {
      const url = initial?.id ? `/api/v1/banks/${initial.id}` : "/api/v1/banks";
      const method = initial?.id ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, logoUrl }),
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
        className="relative w-full max-w-sm rounded-[var(--radius-lg)] border border-border bg-surface p-5"
      >
        <h2 className="mb-4 text-sm font-semibold text-foreground">
          {initial?.id ? "ویرایش بانک" : "بانک جدید"}
        </h2>

        <div className="flex flex-col gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-foreground/80">
              نام بانک
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثلاً بانک ملت"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-foreground/80">
              لوگو (اختیاری)
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />
            {logoUrl ? (
              <div className="flex items-center gap-3">
                <div className="relative size-14 overflow-hidden rounded-[var(--radius-md)] border border-border bg-white">
                  <Image src={logoUrl} alt="لوگوی بانک" fill className="object-contain p-1" />
                </div>
                <button
                  type="button"
                  onClick={() => setLogoUrl(null)}
                  className="flex items-center gap-1 text-xs text-danger"
                >
                  <X className="size-3.5" />
                  حذف لوگو
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex size-14 items-center justify-center rounded-[var(--radius-md)] border border-dashed border-border text-muted hover:bg-surface-subtle"
              >
                {uploading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <ImagePlus className="size-4" />
                )}
              </button>
            )}
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
