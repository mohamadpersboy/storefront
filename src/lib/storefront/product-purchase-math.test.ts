import { describe, expect, it } from "vitest";
import { clampQuantity, computeSelectionTotal, getVariantDisplayLabel } from "./product-purchase-math";

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

describe("getVariantDisplayLabel", () => {
  it("uses color + attribute values when both are present", () => {
    const label = getVariantDisplayLabel({
      colorName: "لاکی",
      attributes: [{ name: "اندازه", value: "۶×۴ متر" }],
      unit: "تخته",
    });
    expect(label).toBe("لاکی — ۶×۴ متر");
  });

  it("joins multiple attribute values", () => {
    const label = getVariantDisplayLabel({
      colorName: null,
      attributes: [
        { name: "اندازه", value: "۶×۴ متر" },
        { name: "شانه", value: "۱۲۰۰" },
      ],
      unit: "تخته",
    });
    expect(label).toBe("۶×۴ متر — ۱۲۰۰");
  });

  it("falls back to the unit when there is no color or attributes", () => {
    const label = getVariantDisplayLabel({ colorName: null, attributes: [], unit: "عدد" });
    expect(label).toBe("عدد");
  });

  it("skips attributes with an empty value", () => {
    const label = getVariantDisplayLabel({
      colorName: "لاکی",
      attributes: [{ name: "اندازه", value: "" }],
      unit: "تخته",
    });
    expect(label).toBe("لاکی");
  });
});
