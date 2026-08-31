import { describe, expect, it } from "vitest";
import { storefrontProductsQuerySchema } from "./storefront-products";

describe("storefrontProductsQuerySchema", () => {
  it("applies default page and limit when nothing is provided", () => {
    const result = storefrontProductsQuerySchema.parse({});
    expect(result).toEqual({ page: 1, limit: 12 });
  });

  it("coerces string query params to numbers", () => {
    const result = storefrontProductsQuerySchema.parse({ page: "3", limit: "20" });
    expect(result).toEqual({ page: 3, limit: 20 });
  });

  it("rejects a page below 1", () => {
    const result = storefrontProductsQuerySchema.safeParse({ page: "0" });
    expect(result.success).toBe(false);
  });

  it("rejects a limit above the maximum", () => {
    const result = storefrontProductsQuerySchema.safeParse({ limit: "100" });
    expect(result.success).toBe(false);
  });

  it("rejects a non-numeric page", () => {
    const result = storefrontProductsQuerySchema.safeParse({ page: "abc" });
    expect(result.success).toBe(false);
  });
});
