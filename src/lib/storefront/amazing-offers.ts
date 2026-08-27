import { connectToDatabase } from "@/lib/db/connect";
import { AmazingOffer } from "@/models/AmazingOffer";
import type { IProduct } from "@/models/Product";
import "@/models/Product";
import { getAmazingOfferStatus, computeAmazingOfferPrice } from "@/lib/utils/amazing-offer";

export interface StorefrontAmazingOffer {
  id: string;
  productSlug: string;
  productTitle: string;
  image: { url: string } | null;
  variantId: string;
  originalPrice: number;
  offerPrice: number;
  discountType: "percent" | "fixed";
  discountValue: number;
  endAt: string; // ISO — client computes the countdown from this
}

/**
 * Only offers whose *computed* status (§26 — backend is always the
 * source of truth, the countdown is UX-only) is currently "active" are
 * returned. `isActive: true` alone is not enough — a scheduled or
 * expired offer would still have that flag set.
 */
export async function getActiveStorefrontAmazingOffers(
  limit = 12,
): Promise<StorefrontAmazingOffer[]> {
  await connectToDatabase();

  const now = new Date();
  const candidates = await AmazingOffer.find({
    isActive: true,
    startAt: { $lte: now },
    endAt: { $gte: now },
  })
    .sort({ endAt: 1 })
    .limit(limit)
    .populate<{ productId: IProduct & { _id: unknown } }>("productId")
    .lean();

  const results: StorefrontAmazingOffer[] = [];

  for (const offer of candidates) {
    const status = getAmazingOfferStatus({
      isActive: offer.isActive,
      startAt: offer.startAt,
      endAt: offer.endAt,
    });
    if (status !== "active") continue;

    const product = offer.productId as unknown as IProduct & { _id: unknown; status: string };
    if (!product || product.status !== "published") continue;

    const variant = product.variants.find((v) => String(v._id) === String(offer.variantId));
    if (!variant || !variant.isActive || variant.stock <= 0) continue;

    results.push({
      id: String(offer._id),
      productSlug: (product as unknown as { slug: string }).slug,
      productTitle: (product as unknown as { title: string }).title,
      image: product.images?.[0] ? { url: product.images[0].url } : null,
      variantId: String(variant._id),
      originalPrice: variant.price,
      offerPrice: computeAmazingOfferPrice(variant.price, offer.discountType, offer.discountValue),
      discountType: offer.discountType,
      discountValue: offer.discountValue,
      endAt: offer.endAt.toISOString(),
    });
  }

  return results;
}
