import { describe, expect, it } from "vitest";
import {
  clampQuantity,
  computeCartAdditionsTotal,
  computeSelectionTotal,
  getVariantDetailSegments,
  mergeCartAddition,
  type CartAddition,
} from "./product-purchase-math";

describe("clampQuantity", () => {
  it("passes through an in-range quantity", () => {
    expect(clampQuantity(3, 10)).toBe(3);
  });

  it("clamps below 1 up to 1", () => {
    expect(clampQuantity(0, 10)).toBe(1);
    expect(clampQuantity(-5, 10)).toBe(1);
  });

  it("clamps above stock down to stock", () => {
    expect(clampQuantity(50, 10)).toBe(10);
  });

  it("still returns 1 for zero stock (out of stock) rather than 0", () => {
    expect(clampQuantity(1, 0)).toBe(1);
    expect(clampQuantity(5, 0)).toBe(1);
  });

  it("rounds a fractional quantity", () => {
    expect(clampQuantity(2.6, 10)).toBe(3);
  });
});

describe("computeSelectionTotal", () => {
  it("multiplies unit price by quantity", () => {
    expect(computeSelectionTotal(78_000, 3)).toBe(234_000);
  });

  it("is 0 for a free item", () => {
    expect(computeSelectionTotal(0, 5)).toBe(0);
  });

  it("is the unit price itself for quantity 1", () => {
    expect(computeSelectionTotal(52_640_000, 1)).toBe(52_640_000);
  });
});

describe("mergeCartAddition", () => {
  it("adds a new row for a variant that isn't in the list yet", () => {
    const result = mergeCartAddition([], {
      variantId: "v1",
      unitLabel: "۱۲ متری",
      quantity: 2,
      unitPrice: 12_500_000,
    });
    expect(result).toEqual([
      { variantId: "v1", unitLabel: "۱۲ متری", quantity: 2, unitPrice: 12_500_000 },
    ]);
  });

  it("sums the quantity when the same variant is added again", () => {
    const existing: CartAddition[] = [
      { variantId: "v1", unitLabel: "۱۲ متری", quantity: 2, unitPrice: 12_500_000 },
    ];
    const result = mergeCartAddition(existing, {
      variantId: "v1",
      unitLabel: "۱۲ متری",
      quantity: 3,
      unitPrice: 12_500_000,
    });
    expect(result).toEqual([
      { variantId: "v1", unitLabel: "۱۲ متری", quantity: 5, unitPrice: 12_500_000 },
    ]);
  });

  it("updates unitPrice to the latest value on a repeated add", () => {
    const existing: CartAddition[] = [
      { variantId: "v1", unitLabel: "۱۲ متری", quantity: 1, unitPrice: 12_500_000 },
    ];
    const result = mergeCartAddition(existing, {
      variantId: "v1",
      unitLabel: "۱۲ متری",
      quantity: 1,
      unitPrice: 11_000_000,
    });
    expect(result[0].unitPrice).toBe(11_000_000);
  });

  it("keeps different variants as separate rows", () => {
    const existing: CartAddition[] = [
      { variantId: "v1", unitLabel: "۱۲ متری", quantity: 2, unitPrice: 12_500_000 },
    ];
    const result = mergeCartAddition(existing, {
      variantId: "v2",
      unitLabel: "۶ متری",
      quantity: 2,
      unitPrice: 27_500_000,
    });
    expect(result).toHaveLength(2);
    expect(result[1]).toEqual({ variantId: "v2", unitLabel: "۶ متری", quantity: 2, unitPrice: 27_500_000 });
  });

  it("does not mutate the input array", () => {
    const existing: CartAddition[] = [
      { variantId: "v1", unitLabel: "۱۲ متری", quantity: 2, unitPrice: 12_500_000 },
    ];
    mergeCartAddition(existing, { variantId: "v1", unitLabel: "۱۲ متری", quantity: 1, unitPrice: 12_500_000 });
    expect(existing[0].quantity).toBe(2);
  });
});

describe("computeCartAdditionsTotal", () => {
  it("sums quantity times unit price across all rows", () => {
    const additions: CartAddition[] = [
      { variantId: "v1", unitLabel: "۱۲ متری", quantity: 2, unitPrice: 12_500_000 },
      { variantId: "v2", unitLabel: "۶ متری", quantity: 2, unitPrice: 27_500_000 },
    ];
    expect(computeCartAdditionsTotal(additions)).toBe(80_000_000);
  });

  it("is 0 for an empty list", () => {
    expect(computeCartAdditionsTotal([])).toBe(0);
  });
});

describe("getVariantDetailSegments", () => {
  it("puts the color segment first when a color is set", () => {
    const segments = getVariantDetailSegments({
      colorName: "لاکی",
      colorHex: "#7a1f2b",
      attributes: [{ name: "عرض", value: "۲ متر" }],
    });
    expect(segments[0]).toEqual({ type: "color", name: "لاکی", hex: "#7a1f2b" });
    expect(segments[1]).toEqual({ type: "attribute", name: "عرض", value: "۲ متر" });
  });

  it("omits the color segment entirely when no color was set", () => {
    const segments = getVariantDetailSegments({
      colorName: null,
      colorHex: null,
      attributes: [{ name: "عرض", value: "۲ متر" }],
    });
    expect(segments).toEqual([{ type: "attribute", name: "عرض", value: "۲ متر" }]);
  });

  it("includes every attribute that has both a name and a value", () => {
    const segments = getVariantDetailSegments({
      colorName: null,
      colorHex: null,
      attributes: [
        { name: "عرض", value: "۲ متر" },
        { name: "طول", value: "۴ متر" },
      ],
    });
    expect(segments).toEqual([
      { type: "attribute", name: "عرض", value: "۲ متر" },
      { type: "attribute", name: "طول", value: "۴ متر" },
    ]);
  });

  it("skips an attribute missing a value", () => {
    const segments = getVariantDetailSegments({
      colorName: null,
      colorHex: null,
      attributes: [{ name: "عرض", value: "" }],
    });
    expect(segments).toEqual([]);
  });

  it("skips an attribute missing a name", () => {
    const segments = getVariantDetailSegments({
      colorName: null,
      colorHex: null,
      attributes: [{ name: "", value: "۲ متر" }],
    });
    expect(segments).toEqual([]);
  });

  it("is an empty array when there is no color and no attributes", () => {
    expect(getVariantDetailSegments({ colorName: null, colorHex: null, attributes: [] })).toEqual([]);
  });

  it("allows a color with no hex code (dot falls back to a neutral color in the UI)", () => {
    const segments = getVariantDetailSegments({ colorName: "کرم", colorHex: null, attributes: [] });
    expect(segments).toEqual([{ type: "color", name: "کرم", hex: null }]);
  });
});
