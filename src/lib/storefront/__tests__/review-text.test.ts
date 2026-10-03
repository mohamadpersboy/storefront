import { describe, expect, it } from "vitest";
import { collapseBlankLines } from "../review-text";

describe("collapseBlankLines", () => {
  it("removes empty and whitespace-only lines", () => {
    expect(collapseBlankLines("سلام\n\n\n  \nخوبه")).toBe("سلام\nخوبه");
  });
  it("normalizes CRLF and trims lines", () => {
    expect(collapseBlankLines("  a \r\n\r\n b  ")).toBe("a\nb");
  });
  it("keeps single-line text and handles empty", () => {
    expect(collapseBlankLines("متن")).toBe("متن");
    expect(collapseBlankLines(" \n ")).toBe("");
  });
});
