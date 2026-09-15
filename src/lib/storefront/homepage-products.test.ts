import { describe, expect, it } from "vitest";
import { pickRepresentativeVariant } from "@/lib/storefront/homepage-products";
import type { IProductVariant } from "@/models/Product";
import type { Types } from "mongoose";

function makeVariant(overrides: Partial<IProductVariant>): IProductVariant {
  return {
    _id: "id" as unknown as Types.ObjectId,
    unit: "متر",
    colorId: null,
    attributes: [],
    price: 1000,
    discountPercent: 0,
    discountAmount: 0,
    stock: 1,
    isActive: true,
    ...overrides,
  };
}

describe("pickRepresentativeVariant", () => {
  it("returns null for an empty variant list", () => {
    expect(pickRepresentativeVariant([])).toBeNull();
  });

  it("picks the cheapest in-stock active variant", () => {
    const cheap = makeVariant({ price: 1000 });
    const expensive = makeVariant({ price: 5000 });
    expect(pickRepresentativeVariant([expensive, cheap])).toBe(cheap);
  });

  it("accounts for discounts when comparing prices", () => {
    // Higher list price but a bigger discount ends up cheaper after computeFinalPrice.
    const heavilyDiscounted = makeVariant({ price: 10000, discountPercent: 90 }); // -> 1000
    const plain = makeVariant({ price: 2000 }); // -> 2000
    expect(pickRepresentativeVariant([plain, heavilyDiscounted])).toBe(heavilyDiscounted);
  });

  it("falls back to active variants with no stock when none are in stock", () => {
    const outOfStock = makeVariant({ price: 1000, stock: 0 });
    expect(pickRepresentativeVariant([outOfStock])).toBe(outOfStock);
  });

  it("falls back to any variant when none are active", () => {
    const inactive = makeVariant({ price: 1000, isActive: false, stock: 0 });
    expect(pickRepresentativeVariant([inactive])).toBe(inactive);
  });

  it("prefers an in-stock active variant over an inactive cheaper one", () => {
    const inactiveCheap = makeVariant({ price: 100, isActive: false });
    const activeInStock = makeVariant({ price: 3000, isActive: true, stock: 5 });
    expect(pickRepresentativeVariant([inactiveCheap, activeInStock])).toBe(activeInStock);
  });
});
