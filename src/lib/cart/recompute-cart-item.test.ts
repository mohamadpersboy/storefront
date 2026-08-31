import { describe, expect, it } from "vitest";
import { recomputeCartItem, type CartVariantSnapshot } from "./recompute-cart-item";

function variant(overrides: Partial<CartVariantSnapshot> = {}): CartVariantSnapshot {
  return {
    price: 1_000_000,
    discountPercent: 0,
    discountAmount: 0,
    stock: 10,
    isActive: true,
    unit: "متر مربع",
    ...overrides,
  };
}

describe("recomputeCartItem", () => {
  it("computes final price and item total for a normal available item", () => {
    const result = recomputeCartItem(3, variant(), true);
    expect(result.isAvailable).toBe(true);
    expect(result.finalUnitPrice).toBe(1_000_000);
    expect(result.itemTotal).toBe(3_000_000);
    expect(result.unavailableReason).toBeNull();
  });

  it("applies a percent discount from the live variant, ignoring any old price", () => {
    const result = recomputeCartItem(2, variant({ discountPercent: 10 }), true);
    expect(result.finalUnitPrice).toBe(900_000);
    expect(result.itemTotal).toBe(1_800_000);
  });

  it("applies a fixed-amount discount", () => {
    const result = recomputeCartItem(1, variant({ discountAmount: 100_000 }), true);
    expect(result.finalUnitPrice).toBe(900_000);
  });

  it("marks unavailable when the product/variant was deleted (null variant)", () => {
    const result = recomputeCartItem(1, null, true);
    expect(result.isAvailable).toBe(false);
    expect(result.itemTotal).toBe(0);
    expect(result.unavailableReason).toMatch(/وجود ندارد/);
  });

  it("marks unavailable when the product itself is no longer published", () => {
    const result = recomputeCartItem(1, variant(), false);
    expect(result.isAvailable).toBe(false);
    expect(result.itemTotal).toBe(0);
  });

  it("marks unavailable when the variant itself is deactivated", () => {
    const result = recomputeCartItem(1, variant({ isActive: false }), true);
    expect(result.isAvailable).toBe(false);
  });

  it("marks unavailable when requested quantity exceeds stock", () => {
    const result = recomputeCartItem(5, variant({ stock: 3 }), true);
    expect(result.isAvailable).toBe(false);
    expect(result.unavailableReason).toContain("3");
  });

  it("gives a distinct message for zero stock", () => {
    const result = recomputeCartItem(1, variant({ stock: 0 }), true);
    expect(result.unavailableReason).toBe("این کالا موجود نیست");
  });

  it("allows a quantity exactly equal to stock", () => {
    const result = recomputeCartItem(3, variant({ stock: 3 }), true);
    expect(result.isAvailable).toBe(true);
    expect(result.itemTotal).toBe(3_000_000);
  });

  it("reflects an updated (changed) price from the live variant, not a stale one", () => {
    // شبیه‌سازی سناریوی «قیمت محصول تغییر کرده» (بند ۹): تابع همیشه
    // از روی variant زنده محاسبه می‌کند، بدون توجه به این‌که قبلاً چه
    // قیمتی در Cart ذخیره شده بود.
    const changedPriceVariant = variant({ price: 2_000_000, discountPercent: 20 });
    const result = recomputeCartItem(1, changedPriceVariant, true);
    expect(result.unitPrice).toBe(2_000_000);
    expect(result.finalUnitPrice).toBe(1_600_000);
  });

  it("never returns a negative item total even with a discount larger than the price", () => {
    const result = recomputeCartItem(1, variant({ discountAmount: 5_000_000 }), true);
    expect(result.finalUnitPrice).toBe(0);
    expect(result.itemTotal).toBe(0);
  });

  it("uses the Amazing Offer when it gives a bigger discount than the variant's own discount", () => {
    const result = recomputeCartItem(
      1,
      variant({ discountPercent: 10 }), // 1,000,000 -> 900,000
      true,
      { discountType: "percent", discountValue: 30 }, // 1,000,000 -> 700,000
    );
    expect(result.finalUnitPrice).toBe(700_000);
    expect(result.discountPercent).toBe(30);
    expect(result.discountAmount).toBe(0);
  });

  it("keeps the variant's own discount when it is bigger than the Amazing Offer", () => {
    const result = recomputeCartItem(
      1,
      variant({ discountPercent: 40 }), // 1,000,000 -> 600,000
      true,
      { discountType: "percent", discountValue: 10 }, // 1,000,000 -> 900,000
    );
    expect(result.finalUnitPrice).toBe(600_000);
    expect(result.discountPercent).toBe(40);
  });

  it("applies a fixed-amount Amazing Offer when it wins", () => {
    const result = recomputeCartItem(
      2,
      variant(), // no variant discount
      true,
      { discountType: "fixed", discountValue: 200_000 },
    );
    expect(result.finalUnitPrice).toBe(800_000);
    expect(result.itemTotal).toBe(1_600_000);
    expect(result.discountAmount).toBe(200_000);
    expect(result.discountPercent).toBe(0);
  });

  it("ignores a null Amazing Offer and falls back to the variant discount", () => {
    const result = recomputeCartItem(1, variant({ discountPercent: 15 }), true, null);
    expect(result.finalUnitPrice).toBe(850_000);
  });
});
