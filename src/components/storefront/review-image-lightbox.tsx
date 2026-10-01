"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { X } from "lucide-react";
import { useScrollLock } from "@/components/storefront/use-scroll-lock";
import type { PublicReviewImageDTO } from "@/lib/reviews/public-serialize";

/**
 * Lightbox ساده: فقط همان تصویر انتخاب‌شده (بدون Gallery). Portal،
 * پس‌زمینه تیره، `object-contain` با سقف ۹۰٪ Viewport، بستن با دکمه،
 * کلیک روی پس‌زمینه یا Escape. فقط وقتی `image` دارد رندر می‌شود.
 */
export function ReviewImageLightbox({
  image,
  onClose,
}: {
  image: PublicReviewImageDTO | null;
  onClose: () => void;
}) {
  const open = image !== null;
  useScrollLock(open);

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [open, onClose]);

  if (!image) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="تصویر نظر"
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-4"
      onClick={onClose}
    >
      <button
        type="button"
        autoFocus
        onClick={onClose}
        aria-label="بستن تصویر"
        className="absolute top-[calc(env(safe-area-inset-top)+12px)] end-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white active:bg-white/25"
      >
        <X className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
      </button>
      <Image
        src={image.url}
        alt="تصویر نظر"
        width={image.width}
        height={image.height}
        sizes="92vw"
        className="h-auto max-h-[88vh] w-auto max-w-[92vw] object-contain"
        onClick={(e) => e.stopPropagation()}
      />
    </div>,
    document.body,
  );
}
