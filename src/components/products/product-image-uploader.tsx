"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ImagePlus, Loader2, X } from "lucide-react";
import { ImageCropModal } from "@/components/products/image-crop-modal";
import { toPersianDigits } from "@/lib/utils/format";

export interface ProductImage {
  url: string;
  publicId: string;
}

const MAX_IMAGES = 10;

export function ProductImageUploader({
  images,
  onChange,
}: {
  images: ProductImage[];
  onChange: (images: ProductImage[]) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingImageSrc, setPendingImageSrc] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow selecting the same file again later
    if (!file) return;

    if (images.length >= MAX_IMAGES) {
      setError(`حداکثر ${toPersianDigits(MAX_IMAGES)} تصویر مجاز است`);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => setPendingImageSrc(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handleCropped(blob: Blob) {
    setPendingImageSrc(null);
    setUploading(true);
    setError(null);

    try {
      const signRes = await fetch("/api/v1/uploads/sign", { method: "POST" });
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

      onChange([
        ...images,
        { url: uploadBody.secure_url, publicId: uploadBody.public_id },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "آپلود تصویر ناموفق بود");
    } finally {
      setUploading(false);
    }
  }

  function removeImage(publicId: string) {
    onChange(images.filter((img) => img.publicId !== publicId));
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
        {images.map((img) => (
          <div
            key={img.publicId}
            className="relative aspect-[3/4] overflow-hidden rounded-[var(--radius-md)] border border-border bg-surface-subtle"
          >
            <Image
              src={img.url}
              alt=""
              fill
              sizes="200px"
              className="object-cover"
            />
            <button
              type="button"
              onClick={() => removeImage(img.publicId)}
              aria-label="حذف تصویر"
              className="absolute left-1 top-1 flex size-6 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
            >
              <X className="size-3.5" />
            </button>
          </div>
        ))}

        {images.length < MAX_IMAGES ? (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex aspect-[3/4] flex-col items-center justify-center gap-1.5 rounded-[var(--radius-md)] border border-dashed border-border-strong text-muted hover:bg-surface-subtle disabled:opacity-50"
          >
            {uploading ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <ImagePlus className="size-5" />
            )}
            <span className="text-xs">
              {uploading ? "در حال آپلود..." : "افزودن تصویر"}
            </span>
          </button>
        ) : null}
      </div>

      <p className="text-xs text-muted">
        {toPersianDigits(images.length)} از {toPersianDigits(MAX_IMAGES)} تصویر
        — نسبت تصاویر ۳:۴ (عمودی) است.
      </p>

      {error ? <p className="text-xs text-danger">{error}</p> : null}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {pendingImageSrc ? (
        <ImageCropModal
          imageSrc={pendingImageSrc}
          onCancel={() => setPendingImageSrc(null)}
          onCropped={handleCropped}
        />
      ) : null}
    </div>
  );
}
