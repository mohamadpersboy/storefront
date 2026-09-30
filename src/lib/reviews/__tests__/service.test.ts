import { beforeEach, describe, expect, it, vi } from "vitest";

const reviewCreate = vi.fn();
const reviewExists = vi.fn();
const reviewFindOneAndUpdate = vi.fn();
const reviewFindOne = vi.fn();
const productFindById = vi.fn();
const orderFindOne = vi.fn();
const validateImages = vi.fn();
const cleanup = vi.fn();

vi.mock("@/models/Review", () => ({
  Review: {
    create: (...a: unknown[]) => reviewCreate(...a),
    exists: (...a: unknown[]) => reviewExists(...a),
    findOneAndUpdate: (...a: unknown[]) => reviewFindOneAndUpdate(...a),
    findOne: (...a: unknown[]) => reviewFindOne(...a),
  },
}));
vi.mock("@/models/Product", () => ({ Product: { findById: (...a: unknown[]) => productFindById(...a) } }));
vi.mock("@/models/Order", () => ({ Order: { findOne: (...a: unknown[]) => orderFindOne(...a) } }));
vi.mock("@/lib/reviews/images", () => ({
  validateReviewImages: (...a: unknown[]) => validateImages(...a),
  cleanupReviewImages: (...a: unknown[]) => cleanup(...a),
}));

import {
  adminDeleteReview,
  checkReviewImageUploadEligibility,
  createReview,
  deleteOwnReview,
  moderateReview,
} from "@/lib/reviews/service";

const USER = "64b7f0c2a1b2c3d4e5f60719";
const PRODUCT = "64b7f0c2a1b2c3d4e5f60718";
const ORDER = "64b7f0c2a1b2c3d4e5f60777";
const RID = "64b7f0c2a1b2c3d4e5f60888";

const input = (images: Array<{ url: string; publicId: string }> = []) => ({
  productId: PRODUCT,
  text: "خوب بود",
  rating: 4,
  recommendation: "recommend" as const,
  images,
});

const chain = (value: unknown) => ({ select: () => ({ lean: async () => value }) });
const productIs = (status: string | null) =>
  productFindById.mockReturnValue(chain(status ? { status } : null));
const orderIs = (id: string | null) =>
  orderFindOne.mockReturnValue({ sort: () => ({ select: () => ({ lean: async () => (id ? { _id: id } : null) }) }) });

beforeEach(() => {
  for (const f of [reviewCreate, reviewExists, reviewFindOneAndUpdate, reviewFindOne, productFindById, orderFindOne, validateImages, cleanup]) f.mockReset();
  cleanup.mockResolvedValue(undefined);
  reviewExists.mockResolvedValue(null);
  reviewCreate.mockImplementation(async (doc) => ({ id: "r1", ...doc }));
  productIs("published");
  orderIs(null);
});

describe("createReview — product eligibility", () => {
  it("allows a published product for a non-buyer (pending, not verified)", async () => {
    const r = await createReview(USER, input());
    expect(r.ok).toBe(true);
    expect(reviewCreate).toHaveBeenCalledWith(
      expect.objectContaining({ status: "pending", isVerifiedBuyer: false, order: null, images: [] }),
    );
  });

  it("rejects a draft product and a deleted (missing) product with 404", async () => {
    productIs("draft");
    expect(await createReview(USER, input())).toMatchObject({ ok: false, status: 404 });
    productIs(null);
    expect(await createReview(USER, input())).toMatchObject({ ok: false, status: 404 });
    expect(reviewCreate).not.toHaveBeenCalled();
  });

  it("allows an archived product only for a previous buyer", async () => {
    productIs("archived");
    expect(await createReview(USER, input())).toMatchObject({ ok: false, status: 403 });
    orderIs(ORDER);
    expect((await createReview(USER, input())).ok).toBe(true);
  });
});

describe("createReview — verified buyer snapshot", () => {
  it("stores isVerifiedBuyer and order for a delivered order", async () => {
    orderIs(ORDER);
    await createReview(USER, input());
    expect(reviewCreate).toHaveBeenCalledWith(expect.objectContaining({ isVerifiedBuyer: true, order: ORDER }));
  });

  it("queries only delivered orders of this user for this product", async () => {
    await createReview(USER, input());
    const filter = orderFindOne.mock.calls[0][0];
    expect(filter.status).toBe("delivered");
    expect(String(filter.customer)).toBe(USER);
    expect(String(filter["items.product"])).toBe(PRODUCT);
  });
});

describe("createReview — images", () => {
  const img = [{ url: "https://res.cloudinary.com/test/image/upload/a.jpg", publicId: "a" }];

  it("rejects images from a non-buyer without touching Cloudinary", async () => {
    expect(await createReview(USER, input(img))).toMatchObject({ ok: false, status: 403 });
    expect(validateImages).not.toHaveBeenCalled();
  });

  it("stores server-validated images for a buyer", async () => {
    orderIs(ORDER);
    const validated = [{ url: img[0].url, publicId: "a", width: 600, height: 800 }];
    validateImages.mockResolvedValue({ ok: true, images: validated });
    await createReview(USER, input(img));
    expect(reviewCreate).toHaveBeenCalledWith(expect.objectContaining({ images: validated }));
  });

  it("returns 422 when image validation fails", async () => {
    orderIs(ORDER);
    validateImages.mockResolvedValue({ ok: false, message: "نسبت تصویر باید ۳:۴ باشد" });
    expect(await createReview(USER, input(img))).toMatchObject({ ok: false, status: 422 });
    expect(reviewCreate).not.toHaveBeenCalled();
  });
});

describe("createReview — duplicates", () => {
  it("returns 409 when an active review exists", async () => {
    reviewExists.mockResolvedValue({ _id: "x" });
    expect(await createReview(USER, input())).toMatchObject({ ok: false, status: 409 });
    expect(reviewExists.mock.calls[0][0]).toMatchObject({ deletedAt: null });
  });

  it("allows a new review after the old one was deleted (exists filter ignores deleted)", async () => {
    reviewExists.mockResolvedValue(null);
    expect((await createReview(USER, input())).ok).toBe(true);
  });

  it("maps a concurrent duplicate (E11000 from the unique index) to 409", async () => {
    reviewCreate.mockRejectedValue(Object.assign(new Error("dup"), { code: 11000 }));
    expect(await createReview(USER, input())).toMatchObject({ ok: false, status: 409 });
  });

  it("rethrows unexpected errors", async () => {
    reviewCreate.mockRejectedValue(new Error("boom"));
    await expect(createReview(USER, input())).rejects.toThrow("boom");
  });
});

describe("delete", () => {
  it("soft-deletes own review in any status and filters by owner", async () => {
    reviewFindOneAndUpdate.mockResolvedValue({ id: RID, images: [{ publicId: "a" }] });
    const r = await deleteOwnReview(USER, RID);
    expect(r.ok).toBe(true);
    const [filter, update] = reviewFindOneAndUpdate.mock.calls[0];
    expect(filter).toMatchObject({ _id: RID, user: USER, deletedAt: null });
    expect(update.$set.deletedAt).toBeInstanceOf(Date);
    expect(cleanup).toHaveBeenCalledWith(["a"]);
  });

  it("returns 404 for someone else's, missing or invalid review", async () => {
    reviewFindOneAndUpdate.mockResolvedValue(null);
    expect(await deleteOwnReview(USER, RID)).toMatchObject({ ok: false, status: 404 });
    expect(await deleteOwnReview(USER, "nope")).toMatchObject({ ok: false, status: 404 });
  });

  it("does not fail the delete when image cleanup fails", async () => {
    reviewFindOneAndUpdate.mockResolvedValue({ id: RID, images: [{ publicId: "a" }] });
    cleanup.mockRejectedValue(new Error("cloudinary down"));
    expect((await deleteOwnReview(USER, RID)).ok).toBe(true);
  });

  it("admin delete does not filter by owner", async () => {
    reviewFindOneAndUpdate.mockResolvedValue({ id: RID, images: [] });
    await adminDeleteReview(RID);
    expect(reviewFindOneAndUpdate.mock.calls[0][0]).not.toHaveProperty("user");
  });
});

describe("moderateReview", () => {
  it("approve only matches pending; reject matches pending + approved", async () => {
    reviewFindOneAndUpdate.mockResolvedValue({ id: RID, status: "approved" });
    await moderateReview({ reviewId: RID, to: "approved", moderatorId: "m1" });
    expect(reviewFindOneAndUpdate.mock.calls[0][0].status.$in).toEqual(["pending"]);

    await moderateReview({ reviewId: RID, to: "rejected", moderatorId: "m1", rejectionReason: "x" });
    expect(reviewFindOneAndUpdate.mock.calls[1][0].status.$in).toEqual(["pending", "approved"]);
    expect(reviewFindOneAndUpdate.mock.calls[1][1].$set).toMatchObject({ status: "rejected", rejectionReason: "x", moderatedBy: "m1" });
  });

  it("returns 409 for rejected → approved and repeated approve", async () => {
    reviewFindOneAndUpdate.mockResolvedValue(null);
    reviewFindOne.mockReturnValue({ select: () => ({ lean: async () => ({ status: "rejected" }) }) });
    expect(await moderateReview({ reviewId: RID, to: "approved", moderatorId: "m" })).toMatchObject({ ok: false, status: 409 });
    reviewFindOne.mockReturnValue({ select: () => ({ lean: async () => ({ status: "approved" }) }) });
    expect(await moderateReview({ reviewId: RID, to: "approved", moderatorId: "m" })).toMatchObject({ ok: false, status: 409 });
  });

  it("returns 404 for deleted/missing reviews", async () => {
    reviewFindOneAndUpdate.mockResolvedValue(null);
    reviewFindOne.mockReturnValue({ select: () => ({ lean: async () => null }) });
    expect(await moderateReview({ reviewId: RID, to: "rejected", moderatorId: "m" })).toMatchObject({ ok: false, status: 404 });
  });
});

describe("checkReviewImageUploadEligibility", () => {
  it("allows verified buyers only", async () => {
    expect(await checkReviewImageUploadEligibility(USER, PRODUCT)).toMatchObject({ ok: false, status: 403 });
    orderIs(ORDER);
    expect((await checkReviewImageUploadEligibility(USER, PRODUCT)).ok).toBe(true);
  });

  it("rejects invalid products", async () => {
    productIs("draft");
    expect(await checkReviewImageUploadEligibility(USER, PRODUCT)).toMatchObject({ ok: false, status: 404 });
  });
});
