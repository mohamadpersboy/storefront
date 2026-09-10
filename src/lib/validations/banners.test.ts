import { describe, expect, it } from "vitest";
import { createBannerSchema, updateBannerSchema } from "./banners";

const validPayload = {
  title: "جشنواره پاییزه فرش",
  href: "/categories",
  imageUrl: "https://res.cloudinary.com/demo/image/upload/banner.jpg",
  imagePublicId: "saghchi-carpet/banners/abc123",
};

describe("createBannerSchema", () => {
  it("accepts a valid payload", () => {
    const result = createBannerSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it("rejects a title shorter than 2 characters", () => {
    const result = createBannerSchema.safeParse({ ...validPayload, title: "ج" });
    expect(result.success).toBe(false);
  });

  it("rejects an href that is neither relative nor absolute", () => {
    const result = createBannerSchema.safeParse({ ...validPayload, href: "categories" });
    expect(result.success).toBe(false);
  });

  it("accepts an absolute http(s) href", () => {
    const result = createBannerSchema.safeParse({
      ...validPayload,
      href: "https://example.com/deal",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid imageUrl", () => {
    const result = createBannerSchema.safeParse({ ...validPayload, imageUrl: "not-a-url" });
    expect(result.success).toBe(false);
  });

  it("accepts a null subtitle/ctaLabel", () => {
    const result = createBannerSchema.safeParse({
      ...validPayload,
      subtitle: null,
      ctaLabel: null,
    });
    expect(result.success).toBe(true);
  });
});

describe("updateBannerSchema", () => {
  it("accepts a partial payload with only isActive", () => {
    const result = updateBannerSchema.safeParse({ isActive: false });
    expect(result.success).toBe(true);
  });

  it("accepts a partial payload with only sortOrder", () => {
    const result = updateBannerSchema.safeParse({ sortOrder: 3 });
    expect(result.success).toBe(true);
  });

  it("accepts an empty object", () => {
    const result = updateBannerSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});
