"use client";

import { useState } from "react";
import Image from "next/image";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function ProductGallery({
  images,
  title,
}: {
  images: { url: string }[];
  title: string;
}) {
  const [active, setActive] = useState(0);

  if (images.length === 0) {
    return (
      <div className="flex aspect-[3/4] w-full items-center justify-center rounded-[var(--radius-lg)] border border-border bg-surface-subtle text-muted-foreground">
        <ImageOff className="size-8" strokeWidth={1.5} />
      </div>
    );
  }

  return (
    <div>
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface-subtle">
        <Image
          src={images[active].url}
          alt={title}
          fill
          priority
          sizes="(min-width: 1024px) 40vw, 100vw"
          className="object-cover"
        />
      </div>

      {images.length > 1 ? (
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {images.map((image, index) => (
            <button
              key={image.url}
              type="button"
              onClick={() => setActive(index)}
              className={cn(
                "relative size-16 shrink-0 overflow-hidden rounded-[var(--radius-sm)] border",
                index === active ? "border-primary" : "border-border",
              )}
            >
              <Image src={image.url} alt="" fill sizes="64px" className="object-cover" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
