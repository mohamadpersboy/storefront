"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ImagePlus, Loader2, X } from "lucide-react";
import { ImageCropModal } from "@/components/products/image-crop-modal";
import { buildBlurDataUrl } from "@/lib/utils/build-blur-data-url";

export interface CategoryImageValue {
  imageUrl: string | null;
  imagePublicId: string | null;
  imageBlurDataUrl: string | null;
}

/**
 * آپلودر تصویر اختیاری دسته‌بندی سطح اول — مربعی (۱:۱)، با همان
 * الگوی Crop محصولات (`ImageCropModal`، فقط با نسبت متفاوت) و همان
 * الگوی Mesh Blur بنرها (`buildBlurDataUrl`). فقط باید در فرم برای
 * دسته‌بندی‌های بدون والد (سطح اول) رندر شود — این کامپوننت خودش
 * این قانون را اجرا نمی‌کند، مسئولیت `category-form.tsx` است.
 */
export function CategoryImageUploader({
  value,
  onChange,
}: {
  value: CategoryImageValue;
  onChange: (value: CategoryImageValue) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingImageSrc, setPendingImageSrc] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => setPendingImageSrc(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handleCropped(blob: Blob) {
    setPendingImageSrc(null);
    setUploading(true);
    setError(null);

    try {
      const signRes = await fetch("/api/v1/uploads/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target: "category-image" }),
      });
      const signBody = await signRes.json();
      if (!signRes.ok || !signBody.success) {
        throw new Error(signBody.message ?? "خطا در آماده‌سازی آپلود");
      }
      const { timestamp, signature, apiKey, cloudName, folder } = signBody.data;

      const formData = new FormData();
      formData.append("file", blob);
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

      const imageBlurDataUrl = await buildBlurDataUrl(uploadBody.secure_url);
      onChange({
        imageUrl: uploadBody.secure_url,
        imagePublicId: uploadBody.public_id,
        imageBlurDataUrl,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "آپلود تصویر ناموفق بود");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />

      {value.imageUrl ? (
        <div className="flex items-center gap-3">
          <div className="relative aspect-square w-24 shrink-0 overflow-hidden rounded-[var(--radius-md)] border border-border bg-surface-subtle">
            <Image src={value.imageUrl} alt="تصویر دسته‌بندی" fill className="object-cover" />
          </div>
          <button
            type="button"
            onClick={() => onChange({ imageUrl: null, imagePublicId: null, imageBlurDataUrl: null })}
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
          className="flex aspect-square w-24 flex-col items-center justify-center gap-1 rounded-[var(--radius-md)] border border-dashed border-border-strong text-muted hover:bg-surface-subtle disabled:opacity-50"
        >
          {uploading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <ImagePlus className="size-4" />
          )}
          <span className="text-[10px]">
            {uploading ? "در حال آپلود..." : "افزودن تصویر"}
          </span>
        </button>
      )}

      {error ? <p className="text-xs text-danger">{error}</p> : null}

      {pendingImageSrc ? (
        <ImageCropModal
          imageSrc={pendingImageSrc}
          aspect={1}
          aspectLabel="۱:۱ (مربعی)"
          onCancel={() => setPendingImageSrc(null)}
          onCropped={handleCropped}
        />
      ) : null}
    </div>
  );
}
