import { describe, expect, it } from "vitest";
import { canTransitionReviewStatus } from "@/lib/reviews/constants";
import { Review } from "@/models/Review";
import { publicVisibleReviewFilter } from "@/lib/reviews/queries";
import { PERMISSIONS, ROLES, roleHasPermission } from "@/lib/constants/rbac";

describe("review lifecycle", () => {
  it("allows pending → approved / rejected and approved → rejected", () => {
    expect(canTransitionReviewStatus("pending", "approved")).toBe(true);
    expect(canTransitionReviewStatus("pending", "rejected")).toBe(true);
    expect(canTransitionReviewStatus("approved", "rejected")).toBe(true);
  });

  it("forbids rejected → approved and repeated transitions", () => {
    expect(canTransitionReviewStatus("rejected", "approved")).toBe(false);
    expect(canTransitionReviewStatus("approved", "approved")).toBe(false);
    expect(canTransitionReviewStatus("rejected", "rejected")).toBe(false);
    expect(canTransitionReviewStatus("approved", "pending")).toBe(false);
  });
});

describe("Review model indexes", () => {
  it("has a partial unique index on { user, product } for non-deleted reviews", () => {
    const unique = Review.schema
      .indexes()
      .find(([fields, opts]) => opts?.unique && "user" in fields && "product" in fields);
    expect(unique).toBeDefined();
    expect(unique![1].partialFilterExpression).toEqual({ deletedAt: { $type: "null" } });
  });

  it("has the listing indexes", () => {
    const keys = Review.schema.indexes().map(([f]) => JSON.stringify(f));
    expect(keys).toContain(JSON.stringify({ product: 1, status: 1, createdAt: -1 }));
    expect(keys).toContain(JSON.stringify({ status: 1, createdAt: -1 }));
    expect(keys).toContain(JSON.stringify({ user: 1, createdAt: -1 }));
  });

  it("defaults to pending, not deleted, not a verified buyer", () => {
    const doc = new Review({
      product: "64b7f0c2a1b2c3d4e5f60718",
      user: "64b7f0c2a1b2c3d4e5f60719",
      rating: 4,
      text: "خوب",
      recommendation: "recommend",
    });
    expect(doc.status).toBe("pending");
    expect(doc.deletedAt).toBeNull();
    expect(doc.isVerifiedBuyer).toBe(false);
    expect(doc.images).toEqual([]);
  });

  it("rejects 3 images and a 481-char text at schema level", async () => {
    const img = (n: number) => ({ url: `u${n}`, publicId: `p${n}`, width: 300, height: 400 });
    const doc = new Review({
      product: "64b7f0c2a1b2c3d4e5f60718",
      user: "64b7f0c2a1b2c3d4e5f60719",
      rating: 4,
      text: "ا".repeat(481),
      recommendation: "recommend",
      images: [img(1), img(2), img(3)],
    });
    const err = await doc.validate().then(
      () => null,
      (e: { errors: Record<string, unknown> }) => e,
    );
    expect(err?.errors.text).toBeDefined();
    expect(err?.errors.images).toBeDefined();
  });
});

describe("visibility filter", () => {
  it("is exactly approved + not deleted", () => {
    expect(publicVisibleReviewFilter()).toEqual({ status: "approved", deletedAt: null });
    expect(publicVisibleReviewFilter("64b7f0c2a1b2c3d4e5f60718")).toMatchObject({
      status: "approved",
      deletedAt: null,
    });
  });
});

describe("review RBAC", () => {
  it("gives Staff read only, Admin and Super Admin read + manage, Customer nothing", () => {
    const { REVIEWS_READ: R, REVIEWS_MANAGE: M } = PERMISSIONS;
    expect(roleHasPermission(ROLES.STAFF, R)).toBe(true);
    expect(roleHasPermission(ROLES.STAFF, M)).toBe(false);
    for (const role of [ROLES.ADMIN, ROLES.SUPER_ADMIN]) {
      expect(roleHasPermission(role, R)).toBe(true);
      expect(roleHasPermission(role, M)).toBe(true);
    }
    expect(roleHasPermission(ROLES.CUSTOMER, R)).toBe(false);
    expect(roleHasPermission(ROLES.CUSTOMER, M)).toBe(false);
  });
});
