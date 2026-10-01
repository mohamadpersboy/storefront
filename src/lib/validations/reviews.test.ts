import { describe, expect, it } from "vitest";
import { createReviewSchema, publicReviewsQuerySchema, rejectReviewSchema } from "@/lib/validations/reviews";

const base = {
  productId: "64b7f0c2a1b2c3d4e5f60718",
  text: "فرش عالی بود",
  rating: 5,
  recommendation: "recommend",
};

describe("createReviewSchema", () => {
  it("accepts 480 characters and rejects 481", () => {
    expect(createReviewSchema.safeParse({ ...base, text: "ا".repeat(480) }).success).toBe(true);
    expect(createReviewSchema.safeParse({ ...base, text: "ا".repeat(481) }).success).toBe(false);
  });

  it("rejects empty or whitespace-only text", () => {
    expect(createReviewSchema.safeParse({ ...base, text: "" }).success).toBe(false);
    expect(createReviewSchema.safeParse({ ...base, text: "   " }).success).toBe(false);
  });

  it.each([1, 5])("accepts rating %i", (rating) => {
    expect(createReviewSchema.safeParse({ ...base, rating }).success).toBe(true);
  });

  it.each([0, 6, 2.5, 0.5, -1, "5", null])("rejects rating %s", (rating) => {
    expect(createReviewSchema.safeParse({ ...base, rating }).success).toBe(false);
  });

  it("accepts only recommend / not_recommend", () => {
    expect(createReviewSchema.safeParse({ ...base, recommendation: "not_recommend" }).success).toBe(true);
    expect(createReviewSchema.safeParse({ ...base, recommendation: "maybe" }).success).toBe(false);
  });

  it("rejects an invalid productId", () => {
    expect(createReviewSchema.safeParse({ ...base, productId: "abc" }).success).toBe(false);
  });

  it("limits images to 2 and defaults to none", () => {
    const img = (n: number) => ({ url: `https://res.cloudinary.com/x/${n}.jpg`, publicId: `p${n}` });
    expect(createReviewSchema.parse(base).images).toEqual([]);
    expect(createReviewSchema.safeParse({ ...base, images: [img(1), img(2)] }).success).toBe(true);
    expect(createReviewSchema.safeParse({ ...base, images: [img(1), img(2), img(3)] }).success).toBe(false);
  });

  it("drops client-supplied sensitive fields", () => {
    const parsed = createReviewSchema.parse({
      ...base,
      status: "approved",
      isVerifiedBuyer: true,
      order: "x",
      moderatedBy: "x",
      deletedAt: null,
    });
    for (const key of ["status", "isVerifiedBuyer", "order", "moderatedBy", "deletedAt"]) {
      expect(parsed).not.toHaveProperty(key);
    }
  });
});

describe("rejectReviewSchema", () => {
  it("makes the reason optional", () => {
    expect(rejectReviewSchema.parse({}).rejectionReason).toBeNull();
    expect(rejectReviewSchema.parse({ rejectionReason: "" }).rejectionReason).toBeNull();
    expect(rejectReviewSchema.parse({ rejectionReason: " توهین " }).rejectionReason).toBe("توهین");
  });

  it("limits the reason length", () => {
    expect(rejectReviewSchema.safeParse({ rejectionReason: "ا".repeat(301) }).success).toBe(false);
  });
});

describe("publicReviewsQuerySchema", () => {
  const ok = { productId: "64b7f0c2a1b2c3d4e5f60718" };
  it("applies defaults and coerces numbers", () => {
    expect(publicReviewsQuerySchema.parse(ok)).toMatchObject({ page: 1, limit: 10 });
    expect(publicReviewsQuerySchema.parse({ ...ok, page: "2", limit: "5" })).toMatchObject({ page: 2, limit: 5 });
  });
  it("rejects bad productId, page and limit", () => {
    for (const bad of [{}, { productId: "x" }, { ...ok, page: 0 }, { ...ok, limit: 0 }, { ...ok, limit: 21 }, { ...ok, page: 1.5 }]) {
      expect(publicReviewsQuerySchema.safeParse(bad).success).toBe(false);
    }
  });
});
