import Image from "next/image";
import Link from "next/link";
import { ImageOff, Sparkles } from "lucide-react";
import type { StorefrontAmazingOffer } from "@/lib/storefront/amazing-offers";
import { formatToman } from "@/lib/utils/format";
import { OfferCountdown } from "./offer-countdown";

export function AmazingOfferStrip({ offers }: { offers: StorefrontAmazingOffer[] }) {
  if (offers.length === 0) return null;

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-1.5 text-base font-semibold text-foreground">
          <Sparkles className="size-4 text-primary" strokeWidth={1.75} />
          تخفیف‌های شگفت‌انگیز
        </h2>
        <Link href="/amazing-offers" className="text-xs font-medium text-primary">
          مشاهده همه
        </Link>
      </div>

      <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 lg:grid-cols-4">
        {offers.map((offer) => (
          <Link
            key={offer.id}
            href={`/products/${offer.productSlug}`}
            className="w-40 shrink-0 overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface sm:w-auto"
          >
            <div className="relative aspect-[3/4] w-full bg-surface-subtle">
              {offer.image ? (
                <Image
                  src={offer.image.url}
                  alt={offer.productTitle}
                  fill
                  sizes="(min-width: 640px) 25vw, 40vw"
                  className="object-cover"
                />
              ) : (
                <div className="flex size-full items-center justify-center text-muted-foreground">
                  <ImageOff className="size-6" strokeWidth={1.5} />
                </div>
              )}
              <div className="absolute top-2 right-2 rounded-[var(--radius-sm)] bg-danger px-1.5 py-0.5 text-[10px] font-semibold text-white">
                {offer.discountType === "percent"
                  ? `٪${offer.discountValue}`
                  : "تخفیف ویژه"}
              </div>
            </div>
            <div className="space-y-1.5 p-2.5">
              <h3 className="line-clamp-1 text-xs font-medium text-foreground">
                {offer.productTitle}
              </h3>
              <p className="text-sm font-semibold text-foreground">
                {formatToman(offer.offerPrice)}
              </p>
              <OfferCountdown endAt={offer.endAt} />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
