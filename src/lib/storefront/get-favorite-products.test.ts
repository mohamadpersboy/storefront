import { describe, expect, it } from "vitest";
import { parseFavoritesPage } from "@/lib/storefront/get-favorite-products";

describe("parseFavoritesPage", () => {
  it("returns 1 when the input is undefined", () => {
    expect(parseFavoritesPage(undefined)).toBe(1);
  });

  it("returns 1 for a non-numeric string", () => {
    expect(parseFavoritesPage("abc")).toBe(1);
  });

  it("returns 1 for zero", () => {
    expect(parseFavoritesPage("0")).toBe(1);
  });

  it("returns 1 for a negative number", () => {
    expect(parseFavoritesPage("-3")).toBe(1);
  });

  it("returns 1 for a decimal number", () => {
    expect(parseFavoritesPage("2.5")).toBe(1);
  });

  it("returns the parsed page for a valid positive integer string", () => {
    expect(parseFavoritesPage("3")).toBe(3);
  });

  it("returns 1 for an empty string", () => {
    expect(parseFavoritesPage("")).toBe(1);
  });
});
