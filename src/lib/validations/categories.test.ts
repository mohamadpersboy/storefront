import { describe, expect, it } from "vitest";
import { createCategorySchema, updateCategorySchema } from "./categories";

const validPayload = {
  name: "فرش ماشینی",
  slug: "farsh-mashini",
};

describe("createCategorySchema", () => {
  it("accepts a minimal valid payload", () => {
    const result = createCategorySchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it("accepts an optional homepage image + showOnHomepage", () => {
    const result = createCategorySchema.safeParse({
      ...validPayload,
      imageUrl: "https://res.cloudinary.com/demo/image/upload/category.jpg",
      imagePublicId: "saghchi-carpet/categories/abc123",
      showOnHomepage: true,
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid imageUrl", () => {
    const result = createCategorySchema.safeParse({
      ...validPayload,
      imageUrl: "not-a-url",
    });
    expect(result.success).toBe(false);
  });

  it("accepts a null image (no image set)", () => {
    const result = createCategorySchema.safeParse({
      ...validPayload,
      imageUrl: null,
      imagePublicId: null,
    });
    expect(result.success).toBe(true);
  });
});

describe("updateCategorySchema", () => {
  it("accepts a partial payload with only showOnHomepage", () => {
    const result = updateCategorySchema.safeParse({ showOnHomepage: false });
    expect(result.success).toBe(true);
  });

  it("accepts an empty object", () => {
    const result = updateCategorySchema.safeParse({});
    expect(result.success).toBe(true);
  });
});
