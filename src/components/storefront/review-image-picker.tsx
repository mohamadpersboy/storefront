"use client";

import { getOverlayRoot } from "@/lib/storefront/overlay-root";
import { useRef, useState } from "react";
import Image from "next/image";
import { createPortal } from "react-dom";
import { ImageCropModal } from "@/components/products/image-crop-modal";
import {
  REVIEW_MAX_IMAGES,
  REVIEW_IMAGE_ASPECT,
} from "@/lib/reviews/constants";
import { mapReviewImageUploadError } from "@/lib/storefront/review-form-messages";
import type { ReviewFormImage } from "@/lib/storefront/review-form";
import { toPersianDigits } from "@/lib/utils/format";

class UploadError extends Error {
  constructor(public status: number | null) {
    super("upload");
  }
}

async function uploadReviewImage(
  blob: Blob,
  productId: string,
): Promise<ReviewFormImage> {
  const signRes = await fetch("/api/v1/uploads/sign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ target: "review-image", productId }),
  }).catch(() => null);
  if (!signRes) throw new UploadError(null);
  const signBody = await signRes.json().catch(() => null);
  if (!signRes.ok || !signBody?.success) throw new UploadError(signRes.status);

  const { timestamp, signature, apiKey, cloudName, folder } = signBody.data;
  const formData = new FormData();
  formData.append("file", blob);
  formData.append("api_key", apiKey);
  formData.append("timestamp", String(timestamp));
  formData.append("signature", signature);
  formData.append("folder", folder);

  const uploadRes = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    {
      method: "POST",
      body: formData,
    },
  ).catch(() => null);
  const uploadBody = uploadRes
    ? await uploadRes.json().catch(() => null)
    : null;
  if (
    !uploadRes ||
    !uploadRes.ok ||
    !uploadBody?.secure_url ||
    !uploadBody?.public_id
  ) {
    throw new UploadError(null);
  }
  // عرض/ارتفاع عمداً از Client فرستاده نمی‌شود؛ Backend از Cloudinary می‌خواند.
  return { url: uploadBody.secure_url, publicId: uploadBody.public_id };
}

/**
 * انتخاب تا ۲ تصویر با برش ۳:۴ و آپلود مستقیم به Cloudinary. تصویر قبل
 * از ثبت نظر قابل حذف است؛ خطای آپلود تصاویر قبلی را نگه می‌دارد.
 */
export function ReviewImagePicker({
  productId,
  images,
  onChange,
  disabled,
}: {
  productId: string;
  images: ReviewFormImage[];
  onChange: (images: ReviewFormImage[]) => void;
  disabled?: boolean;
}) {
  const [pendingSrc, setPendingSrc] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const full = images.length >= REVIEW_MAX_IMAGES;

  function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("فقط فایل تصویر مجاز است.");
      return;
    }
    setError(null);
    const reader = new FileReader();
    reader.onload = () => setPendingSrc(String(reader.result));
    reader.readAsDataURL(file);
  }

  async function handleCropped(blob: Blob) {
    setPendingSrc(null);
    setUploading(true);
    setError(null);
    try {
      const image = await uploadReviewImage(blob, productId);
      onChange([...images, image]);
    } catch (err) {
      setError(
        mapReviewImageUploadError(
          err instanceof UploadError ? err.status : null,
        ),
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {images.map((img, index) => (
          <div key={img.publicId} className="flex flex-col items-center gap-1">
            <div className="relative h-24 w-[4.5rem] overflow-hidden rounded-lg bg-gray-100">
              <Image
                src={img.url}
                alt={`تصویر نظر ${toPersianDigits(index + 1)}`}
                fill
                sizes="72px"
                className="object-cover"
              />
            </div>
            <button
              type="button"
              disabled={disabled || uploading}
              onClick={() =>
                onChange(images.filter((i) => i.publicId !== img.publicId))
              }
              className="text-xs text-red-600 disabled:opacity-50"
            >
              حذف تصویر
            </button>
          </div>
        ))}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />
      <button
        type="button"
        disabled={disabled || uploading || full}
        onClick={() => inputRef.current?.click()}
        className="h-10 w-max rounded-xl border border-gray-200 px-4 text-sm text-[var(--sf-ink)] disabled:opacity-50"
      >
        {uploading ? "در حال آپلود…" : "افزودن تصویر"}
      </button>
      <p className="text-xs text-gray-500">
        حداکثر {toPersianDigits(REVIEW_MAX_IMAGES)} تصویر، با نسبت ۳:۴.
        {full ? " سقف تصاویر پر شده است." : ""}
      </p>
      {error ? (
        <p role="alert" className="text-xs text-red-600">
          {error}
        </p>
      ) : null}

      {pendingSrc && typeof document !== "undefined"
        ? createPortal(
            <ImageCropModal
              imageSrc={pendingSrc}
              aspect={REVIEW_IMAGE_ASPECT}
              onCancel={() => setPendingSrc(null)}
              onCropped={handleCropped}
            />,
            getOverlayRoot(),
          )
        : null}
    </div>
  );
}
