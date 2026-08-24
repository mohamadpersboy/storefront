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

export type PaymentMethod = "online" | "cash" | "split";

export interface PrepaymentBreakdown {
  prepaymentPercent: number;
  prepaymentAmount: number;
  remainingAmount: number;
}

/**
 * Computes the prepayment split for an order (Master Prompt section
 * 29-30). The admin never sets the raw amount directly — only the
 * percentage for "split" orders — so the person placing/managing an
 * order can't manipulate the amounts; the server always derives them.
 */
export function computePrepayment(
  paymentMethod: PaymentMethod,
  totalAmount: number,
  splitPrepaymentPercent?: number,
): PrepaymentBreakdown {
  const prepaymentPercent =
    paymentMethod === "online"
      ? 100
      : paymentMethod === "cash"
        ? 0
        : Math.min(100, Math.max(0, splitPrepaymentPercent ?? 0));

  const prepaymentAmount = Math.round((totalAmount * prepaymentPercent) / 100);
  const remainingAmount = totalAmount - prepaymentAmount;

  return { prepaymentPercent, prepaymentAmount, remainingAmount };
}
