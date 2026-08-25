import { computeFinalPrice } from "@/lib/utils/pricing";
import type { AmazingOfferDiscountType } from "@/models/AmazingOffer";

export type AmazingOfferComputedStatus = "scheduled" | "active" | "expired" | "paused";

/**
 * The Backend is always the source of truth for offer status (Master
 * Prompt §26: "Countdown فقط برای UX است و منبع حقیقت باید Backend
 * باشد"). This function is that source — it's the only place that
 * decides whether an offer is currently live, so UI and API always
 * agree.
 */
export function getAmazingOfferStatus(offer: {
  isActive: boolean;
  startAt: Date;
  endAt: Date;
}): AmazingOfferComputedStatus {
  if (!offer.isActive) return "paused";
  const now = Date.now();
  if (now < offer.startAt.getTime()) return "scheduled";
  if (now > offer.endAt.getTime()) return "expired";
  return "active";
}

export function isAmazingOfferLive(offer: {
  isActive: boolean;
  startAt: Date;
  endAt: Date;
}): boolean {
  return getAmazingOfferStatus(offer) === "active";
}

export function computeAmazingOfferPrice(
  basePrice: number,
  discountType: AmazingOfferDiscountType,
  discountValue: number,
): number {
  return discountType === "percent"
    ? computeFinalPrice(basePrice, discountValue, 0)
    : computeFinalPrice(basePrice, 0, discountValue);
}

/** Default Amazing Offer duration per Master Prompt §25. */
export const DEFAULT_AMAZING_OFFER_DURATION_MS = 24 * 60 * 60 * 1000;
