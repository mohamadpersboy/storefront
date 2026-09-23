import { describe, expect, it } from "vitest";
import { parsePageParam } from "@/lib/utils/pagination";

describe("parsePageParam", () => {
  it("returns 1 when the input is undefined", () => {
    expect(parsePageParam(undefined)).toBe(1);
  });

  it("returns 1 for a non-numeric string", () => {
    expect(parsePageParam("abc")).toBe(1);
  });

  it("returns 1 for zero", () => {
    expect(parsePageParam("0")).toBe(1);
  });

  it("returns 1 for a negative number", () => {
    expect(parsePageParam("-3")).toBe(1);
  });

  it("returns 1 for a decimal number", () => {
    expect(parsePageParam("2.5")).toBe(1);
  });

  it("returns the parsed page for a valid positive integer string", () => {
    expect(parsePageParam("3")).toBe(3);
  });

  it("returns 1 for an empty string", () => {
    expect(parsePageParam("")).toBe(1);
  });
});
