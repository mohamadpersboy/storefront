import { describe, expect, it } from "vitest";
import {
  buildCategoryIdGroups,
  pickRepresentativeVariant,
  sortByPriority,
} from "@/lib/storefront/homepage-products";
import type { IProductVariant } from "@/models/Product";
import type { Types } from "mongoose";

function asObjectId(id: string): Types.ObjectId {
  return id as unknown as Types.ObjectId;
}

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
    sortOrder: 0,
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

  it("picks the variant with the lowest sortOrder (priority) over a cheaper one", () => {
    const cheapButLowPriority = makeVariant({ price: 1000, sortOrder: 5 });
    const pricierButHighPriority = makeVariant({ price: 9000, sortOrder: 1 });
    expect(
      pickRepresentativeVariant([cheapButLowPriority, pricierButHighPriority]),
    ).toBe(pricierButHighPriority);
  });

  it("falls back to cheapest price when all variants have equal priority", () => {
    const a = makeVariant({ price: 2000, sortOrder: 3 });
    const b = makeVariant({ price: 1000, sortOrder: 3 });
    expect(pickRepresentativeVariant([a, b])).toBe(b);
  });

  it("treats a missing sortOrder as 0 when comparing priority", () => {
    const noPriority = makeVariant({ price: 5000, sortOrder: undefined as unknown as number });
    const explicitZero = makeVariant({ price: 1000, sortOrder: 0 });
    // Equal effective priority (0) -> falls back to cheapest price.
    expect(pickRepresentativeVariant([noPriority, explicitZero])).toBe(explicitZero);
  });
});

describe("buildCategoryIdGroups", () => {
  it("maps each root category to at least itself", () => {
    const groups = buildCategoryIdGroups([asObjectId("root1"), asObjectId("root2")], []);
    expect(groups.get("root1")).toEqual(["root1"]);
    expect(groups.get("root2")).toEqual(["root2"]);
  });

  it("adds each child's id under its parent's group", () => {
    const groups = buildCategoryIdGroups(
      [asObjectId("root1"), asObjectId("root2")],
      [
        { _id: asObjectId("child1"), parentId: asObjectId("root1") },
        { _id: asObjectId("child2"), parentId: asObjectId("root1") },
        { _id: asObjectId("child3"), parentId: asObjectId("root2") },
      ],
    );
    expect(groups.get("root1")).toEqual(["root1", "child1", "child2"]);
    expect(groups.get("root2")).toEqual(["root2", "child3"]);
  });

  it("ignores children whose parent is not in the root list", () => {
    const groups = buildCategoryIdGroups(
      [asObjectId("root1")],
      [{ _id: asObjectId("orphan"), parentId: asObjectId("unrelated-root") }],
    );
    expect(groups.get("root1")).toEqual(["root1"]);
    expect(groups.has("unrelated-root")).toBe(false);
  });
});

describe("sortByPriority", () => {
  it("orders items by ascending priority (smaller number first)", () => {
    const items = [
      { id: "a", sortOrder: 5 },
      { id: "b", sortOrder: 1 },
      { id: "c", sortOrder: 3 },
    ];
    expect(sortByPriority(items, (i) => i.sortOrder).map((i) => i.id)).toEqual(["b", "c", "a"]);
  });

  it("treats a missing priority as 0", () => {
    const items = [
      { id: "a", sortOrder: 2 },
      { id: "b", sortOrder: undefined },
    ];
    expect(sortByPriority(items, (i) => i.sortOrder).map((i) => i.id)).toEqual(["b", "a"]);
  });

  it("is stable: equal priorities keep their original relative order", () => {
    const items = [
      { id: "a", sortOrder: 0 },
      { id: "b", sortOrder: 0 },
      { id: "c", sortOrder: 0 },
    ];
    expect(sortByPriority(items, (i) => i.sortOrder).map((i) => i.id)).toEqual(["a", "b", "c"]);
  });

  it("does not mutate the original array", () => {
    const items = [
      { id: "a", sortOrder: 2 },
      { id: "b", sortOrder: 1 },
    ];
    const result = sortByPriority(items, (i) => i.sortOrder);
    expect(result).not.toBe(items);
    expect(items.map((i) => i.id)).toEqual(["a", "b"]);
  });
});
