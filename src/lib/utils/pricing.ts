/**
 * Computes the final sale price for a variant after applying both a
 * percentage discount and a fixed-amount discount (Master Prompt
 * section 23-24 allows either or both). Never returns a negative price.
 */
export function computeFinalPrice(
  price: number,
  discountPercent: number,
  discountAmount: number,
): number {
  const afterPercent = price - (price * discountPercent) / 100;
  const afterAmount = afterPercent - discountAmount;
  return Math.max(0, Math.round(afterAmount));
}

export function hasDiscount(discountPercent: number, discountAmount: number): boolean {
  return discountPercent > 0 || discountAmount > 0;
}
