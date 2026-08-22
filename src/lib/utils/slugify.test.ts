import { describe, it, expect } from "vitest";
import { slugify } from "@/lib/utils/slugify";

describe("slugify", () => {
  it("lowercases and replaces spaces with dashes", () => {
    expect(slugify("Machine Made Carpet")).toBe("machine-made-carpet");
  });

  it("strips characters outside a-z0-9 and dashes", () => {
    expect(slugify("Carpet #1200 (Premium)!")).toBe("carpet-1200-premium");
  });

  it("collapses multiple dashes into one", () => {
    expect(slugify("a   b---c")).toBe("a-b-c");
  });

  it("trims leading and trailing dashes", () => {
    expect(slugify("  -hello-  ")).toBe("hello");
  });

  it("returns an empty string for input with no latin characters", () => {
    expect(slugify("فرش ماشینی")).toBe("");
  });
});
