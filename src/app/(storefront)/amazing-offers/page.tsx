import { Sparkles } from "lucide-react";
import { getActiveStorefrontAmazingOffers } from "@/lib/storefront/amazing-offers";
import { EmptyState } from "@/components/ui/empty-state";
import Image from "next/image";
import Link from "next/link";
import { ImageOff } from "lucide-react";
import { formatToman } from "@/lib/utils/format";
import { OfferCountdown } from "@/components/storefront/offer-countdown";

export const metadata = {
  title: "تخفیف‌های شگفت‌انگیز",
};

// Always live — see (storefront)/page.tsx for rationale.
export const dynamic = "force-dynamic";

export default async function AmazingOffersPage() {
  const offers = await getActiveStorefrontAmazingOffers(48);

  return (
    <div>
      <h1 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
        <Sparkles className="size-5 text-primary" strokeWidth={1.75} />
        تخفیف‌های شگفت‌انگیز
      </h1>

      {offers.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="در حال حاضر تخفیف شگفت‌انگیزی فعال نیست"
          description="به‌زودی پیشنهادهای ویژه جدید اضافه می‌شود."
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {offers.map((offer) => (
            <Link
              key={offer.id}
              href={`/products/${offer.productSlug}`}
              className="overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface"
            >
              <div className="relative aspect-[3/4] w-full bg-surface-subtle">
                {offer.image ? (
                  <Image
                    src={offer.image.url}
                    alt={offer.productTitle}
                    fill
                    sizes="(min-width: 1024px) 22vw, (min-width: 640px) 33vw, 50vw"
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
                <div className="flex items-baseline gap-1.5">
                  <p className="text-sm font-semibold text-foreground">
                    {formatToman(offer.offerPrice)}
                  </p>
                  <p className="text-[11px] text-muted-foreground line-through">
                    {formatToman(offer.originalPrice)}
                  </p>
                </div>
                <OfferCountdown endAt={offer.endAt} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
