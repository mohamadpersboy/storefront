import { describe, expect, it } from "vitest";
import { createBrandSchema, updateBrandSchema } from "./brands";

const validPayload = {
  name: "کاشان",
  slug: "kashan",
};

describe("createBrandSchema", () => {
  it("accepts a minimal valid payload", () => {
    const result = createBrandSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it("accepts an optional square image + showOnHomepage", () => {
    const result = createBrandSchema.safeParse({
      ...validPayload,
      imageUrl: "https://res.cloudinary.com/demo/image/upload/brand.jpg",
      imagePublicId: "saghchi-carpet/brands/abc123",
      showOnHomepage: true,
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid imageUrl", () => {
    const result = createBrandSchema.safeParse({
      ...validPayload,
      imageUrl: "not-a-url",
    });
    expect(result.success).toBe(false);
  });

  it("accepts a null image (no image set)", () => {
    const result = createBrandSchema.safeParse({
      ...validPayload,
      imageUrl: null,
      imagePublicId: null,
    });
    expect(result.success).toBe(true);
  });

  it("rejects a name shorter than 2 characters", () => {
    const result = createBrandSchema.safeParse({ ...validPayload, name: "ک" });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid slug", () => {
    const result = createBrandSchema.safeParse({ ...validPayload, slug: "کاشان" });
    expect(result.success).toBe(false);
  });
});

describe("updateBrandSchema", () => {
  it("accepts a partial payload with only showOnHomepage", () => {
    const result = updateBrandSchema.safeParse({ showOnHomepage: false });
    expect(result.success).toBe(true);
  });

  it("accepts a partial payload with only sortOrder", () => {
    const result = updateBrandSchema.safeParse({ sortOrder: 3 });
    expect(result.success).toBe(true);
  });

  it("accepts an empty object", () => {
    const result = updateBrandSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});
