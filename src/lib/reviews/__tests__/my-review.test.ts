import { beforeEach, describe, expect, it, vi } from "vitest";

const reviewFindOne = vi.fn();
const productFindById = vi.fn();
const orderFindOne = vi.fn();

vi.mock("@/models/Review", () => ({
  Review: { findOne: (...a: unknown[]) => reviewFindOne(...a) },
}));
vi.mock("@/models/Product", () => ({
  Product: { findById: (...a: unknown[]) => productFindById(...a) },
}));
vi.mock("@/models/Order", () => ({
  Order: { findOne: (...a: unknown[]) => orderFindOne(...a) },
}));

import { getMyReviewState } from "@/lib/reviews/my-review";

const USER = "64b7f0c2a1b2c3d4e5f60719";
const PRODUCT = "64b7f0c2a1b2c3d4e5f60718";

const chain = (value: unknown) => ({
  select: () => ({ lean: async () => value }),
});
const productIs = (status: string | null) =>
  productFindById.mockReturnValue(chain(status ? { status } : null));
const buyer = (is: boolean) =>
  orderFindOne.mockReturnValue({
    sort: () => ({
      select: () => ({ lean: async () => (is ? { _id: "o1" } : null) }),
    }),
  });
const ownReview = (doc: unknown) => reviewFindOne.mockReturnValue(chain(doc));

const doc = (over: Record<string, unknown> = {}) => ({
  _id: "r1",
  status: "pending",
  rating: 4,
  recommendation: "recommend",
  text: "خوب",
  createdAt: new Date("2026-10-01T10:00:00Z"),
  images: [
    {
      url: "https://res.cloudinary.com/x/a.jpg",
      publicId: "secret/a",
      width: 600,
      height: 800,
    },
  ],
  // فیلدهای داخلی که نباید بیرون بروند
  user: USER,
  product: PRODUCT,
  order: "o1",
  rejectionReason: "دلیل داخلی",
  moderatedBy: "m1",
  ...over,
});

beforeEach(() => {
  for (const f of [reviewFindOne, productFindById, orderFindOne]) f.mockReset();
  productIs("published");
  buyer(false);
  ownReview(null);
});

describe("getMyReviewState — review lookup", () => {
  it("returns the user's own active review as a private DTO", async () => {
    ownReview(doc());
    const s = await getMyReviewState(USER, PRODUCT);
    expect(s.review).toEqual({
      id: "r1",
      status: "pending",
      rating: 4,
      recommendation: "recommend",
      text: "خوب",
      images: [
        { url: "https://res.cloudinary.com/x/a.jpg", width: 600, height: 800 },
      ],
      createdAt: "2026-10-01T10:00:00.000Z",
    });
  });

  it("never exposes rejectionReason, publicId, order or internal ids", async () => {
    ownReview(doc({ status: "rejected" }));
    const json = JSON.stringify(await getMyReviewState(USER, PRODUCT));
    for (const leak of [
      "secret/a",
      "دلیل داخلی",
      "m1",
      "o1",
      "rejectionReason",
      "publicId",
      "moderatedBy",
      USER,
      PRODUCT,
    ]) {
      expect(json).not.toContain(leak);
    }
  });

  it("queries only this user's, this product's, non-deleted review", async () => {
    await getMyReviewState(USER, PRODUCT);
    const filter = reviewFindOne.mock.calls[0][0];
    expect(String(filter.user)).toBe(USER);
    expect(String(filter.product)).toBe(PRODUCT);
    expect(filter.deletedAt).toBeNull();
  });

  it("returns review null when there is none (deleted ones are filtered by the query)", async () => {
    expect((await getMyReviewState(USER, PRODUCT)).review).toBeNull();
  });

  it("ignores another user's review: the filter is scoped to the caller", async () => {
    const OTHER = "64b7f0c2a1b2c3d4e5f60000";
    await getMyReviewState(OTHER, PRODUCT);
    expect(String(reviewFindOne.mock.calls[0][0].user)).toBe(OTHER);
  });

  it("returns every status as stored (pending / approved / rejected)", async () => {
    for (const status of ["pending", "approved", "rejected"]) {
      ownReview(doc({ status }));
      expect((await getMyReviewState(USER, PRODUCT)).review?.status).toBe(
        status,
      );
    }
  });

  it("handles a legacy review without images", async () => {
    ownReview(doc({ images: undefined }));
    expect((await getMyReviewState(USER, PRODUCT)).review?.images).toEqual([]);
  });
});

describe("getMyReviewState — eligibility", () => {
  it("published + non-buyer: can review, cannot add images", async () => {
    expect(await getMyReviewState(USER, PRODUCT)).toMatchObject({
      canReview: true,
      canAddImages: false,
      ineligibleReason: null,
    });
  });

  it("published + verified buyer: can add images", async () => {
    buyer(true);
    expect(await getMyReviewState(USER, PRODUCT)).toMatchObject({
      canReview: true,
      canAddImages: true,
    });
  });

  it("archived + buyer: allowed, with images", async () => {
    productIs("archived");
    buyer(true);
    expect(await getMyReviewState(USER, PRODUCT)).toMatchObject({
      canReview: true,
      canAddImages: true,
    });
  });

  it("archived + non-buyer: not allowed, buyers_only", async () => {
    productIs("archived");
    expect(await getMyReviewState(USER, PRODUCT)).toMatchObject({
      canReview: false,
      canAddImages: false,
      ineligibleReason: "buyers_only",
    });
  });

  it("draft and deleted (missing) product: not allowed, unavailable", async () => {
    productIs("draft");
    expect(await getMyReviewState(USER, PRODUCT)).toMatchObject({
      canReview: false,
      ineligibleReason: "unavailable",
    });
    productIs(null);
    expect(await getMyReviewState(USER, PRODUCT)).toMatchObject({
      canReview: false,
      ineligibleReason: "unavailable",
    });
  });

  it("still returns the existing review when the user is no longer eligible", async () => {
    productIs("archived");
    ownReview(doc());
    const s = await getMyReviewState(USER, PRODUCT);
    expect(s.review?.id).toBe("r1");
    expect(s.canReview).toBe(false);
  });

  it("canReview does not depend on an existing review (so delete → form works)", async () => {
    ownReview(doc());
    expect((await getMyReviewState(USER, PRODUCT)).canReview).toBe(true);
  });

  it("rejects malformed ids without touching the DB", async () => {
    expect(await getMyReviewState("bad", PRODUCT)).toMatchObject({
      canReview: false,
      review: null,
    });
    expect(reviewFindOne).not.toHaveBeenCalled();
    expect(productFindById).not.toHaveBeenCalled();
  });
});
