import { describe, expect, it } from "vitest";
import {
  parseAttributeFilters,
  parseCategoryProductsQuery,
  serializeAttributeFilter,
} from "./storefront-category-products";

describe("parseAttributeFilters", () => {
  it("parses name:value pairs", () => {
    expect(parseAttributeFilters(["شانه:1200", "اندازه:9 متری"])).toEqual([
      { name: "شانه", value: "1200" },
      { name: "اندازه", value: "9 متری" },
    ]);
  });

  it("ignores malformed entries (no colon, empty name/value)", () => {
    expect(parseAttributeFilters(["بدون-جداکننده", ":value", "name:", ""])).toEqual([]);
  });

  it("supports a value that itself contains a colon", () => {
    expect(parseAttributeFilters(["زمان:10:30"])).toEqual([{ name: "زمان", value: "10:30" }]);
  });
});

describe("serializeAttributeFilter", () => {
  it("round-trips through parseAttributeFilters", () => {
    const filter = { name: "شانه", value: "1200" };
    expect(parseAttributeFilters([serializeAttributeFilter(filter)])).toEqual([filter]);
  });
});

describe("parseCategoryProductsQuery", () => {
  it("applies defaults when nothing is provided", () => {
    const result = parseCategoryProductsQuery(new URLSearchParams());
    expect(result).toMatchObject({ sort: "default", page: 1, brand: [], attrs: [] });
  });

  it("parses comma-separated and repeated brand params together", () => {
    const params = new URLSearchParams();
    params.append("brand", "a,b");
    params.append("brand", "c");
    const result = parseCategoryProductsQuery(params);
    expect(result.brand).toEqual(["a", "b", "c"]);
  });

  it("parses price range, sort, page and attrs", () => {
    const params = new URLSearchParams();
    params.set("minPrice", "100000");
    params.set("maxPrice", "500000");
    params.set("sort", "cheapest");
    params.set("page", "3");
    params.append("attr", "شانه:1200");
    const result = parseCategoryProductsQuery(params);
    expect(result.minPrice).toBe(100000);
    expect(result.maxPrice).toBe(500000);
    expect(result.sort).toBe("cheapest");
    expect(result.page).toBe(3);
    expect(result.attrs).toEqual([{ name: "شانه", value: "1200" }]);
  });

  it("falls back to defaults on invalid sort/page instead of throwing", () => {
    const params = new URLSearchParams();
    params.set("sort", "not-a-real-sort");
    params.set("page", "-5");
    const result = parseCategoryProductsQuery(params);
    expect(result.sort).toBe("default");
    expect(result.page).toBe(1);
  });
});
