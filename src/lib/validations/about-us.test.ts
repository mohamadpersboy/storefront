import { describe, expect, it } from "vitest";
import { updateAboutUsSchema } from "./about-us";

describe("updateAboutUsSchema", () => {
  it("accepts valid data with empty imageUrl", () => {
    const result = updateAboutUsSchema.safeParse({
      title: "درباره ما",
      content: "متن معرفی فروشگاه",
      imageUrl: "",
    });
    expect(result.success).toBe(true);
  });

  it("accepts a valid imageUrl", () => {
    const result = updateAboutUsSchema.safeParse({
      title: "درباره ما",
      content: "متن معرفی فروشگاه",
      imageUrl: "https://example.com/image.jpg",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a title shorter than 2 characters", () => {
    const result = updateAboutUsSchema.safeParse({
      title: "ا",
      content: "متن",
      imageUrl: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty content", () => {
    const result = updateAboutUsSchema.safeParse({
      title: "درباره ما",
      content: "",
      imageUrl: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid imageUrl", () => {
    const result = updateAboutUsSchema.safeParse({
      title: "درباره ما",
      content: "متن",
      imageUrl: "not-a-url",
    });
    expect(result.success).toBe(false);
  });
});
