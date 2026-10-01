import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const paginate = vi.fn();
const aggregate = vi.fn();
const productFindOne = vi.fn();
const userFind = vi.fn();

vi.mock("@/lib/db/connect", () => ({ connectToDatabase: vi.fn() }));
vi.mock("@/models/Review", () => ({
  Review: { paginate: (...a: unknown[]) => paginate(...a), aggregate: (...a: unknown[]) => aggregate(...a) },
}));
vi.mock("@/models/Product", () => ({ Product: { findOne: (...a: unknown[]) => productFindOne(...a) } }));
vi.mock("@/models/User", () => ({ User: { find: (...a: unknown[]) => userFind(...a) } }));
vi.mock("@/models/Order", () => ({}));

import { GET } from "@/app/api/v1/reviews/route";

const PRODUCT = "64b7f0c2a1b2c3d4e5f60718";
const U1 = "64b7f0c2a1b2c3d4e5f60001";
const get = (qs: string) => GET(new NextRequest(`http://localhost/api/v1/reviews?${qs}`));
const chain = (v: unknown) => ({ select: () => ({ lean: async () => v }) });

const page = (docs: unknown[], over: Record<string, unknown> = {}) => ({
  docs,
  totalDocs: docs.length,
  totalPages: docs.length ? 1 : 0,
  page: 1,
  limit: 10,
  hasNextPage: false,
  hasPrevPage: false,
  ...over,
});

const doc = {
  user: U1,
  rating: 5,
  text: "عالی",
  recommendation: "recommend",
  isVerifiedBuyer: true,
  images: [{ url: "https://res.cloudinary.com/x/a.jpg", publicId: "p/a", width: 600, height: 800 }],
  createdAt: new Date("2026-09-30T10:00:00Z"),
  status: "approved",
  order: "o1",
  moderatedBy: "m1",
};

beforeEach(() => {
  for (const f of [paginate, aggregate, productFindOne, userFind]) f.mockReset();
  productFindOne.mockReturnValue(chain({ _id: PRODUCT }));
  aggregate.mockResolvedValue([{ avg: 4.5, count: 4, recommend: 3, verified: 2 }]);
  paginate.mockResolvedValue(page([doc]));
  userFind.mockReturnValue(chain([{ _id: U1, fullName: "محمد رضایی" }]));
});

describe("GET /api/v1/reviews (public)", () => {
  it("needs no login and returns items + stats + pagination as public DTOs", async () => {
    const res = await get(`productId=${PRODUCT}`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.items).toEqual([
      {
        displayName: "محمد ر.",
        rating: 5,
        recommendation: "recommend",
        text: "عالی",
        isVerifiedBuyer: true,
        images: [{ url: "https://res.cloudinary.com/x/a.jpg", width: 600, height: 800 }],
        createdAt: "2026-09-30T10:00:00.000Z",
      },
    ]);
    expect(body.data.stats).toEqual({
      averageRating: 4.5,
      ratingCount: 4,
      recommendCount: 3,
      notRecommendCount: 1,
      verifiedBuyerCount: 2,
    });
    expect(body.pagination).toMatchObject({ totalDocs: 1, totalPages: 1, page: 1, limit: 10 });
  });

  it("never leaks internal fields", async () => {
    const json = JSON.stringify(await (await get(`productId=${PRODUCT}`)).json());
    for (const leak of [U1, "p/a", "o1", "m1", "moderatedBy", "rejectionReason", "deletedAt", "status", "publicId"]) {
      expect(json).not.toContain(leak);
    }
  });

  it("queries only approved + not deleted reviews of this product (pending/rejected/deleted excluded)", async () => {
    await get(`productId=${PRODUCT}`);
    const filter = paginate.mock.calls[0][0];
    expect(filter).toMatchObject({ status: "approved", deletedAt: null });
    expect(String(filter.product)).toBe(PRODUCT);
    // آمار هم از همان فیلتر
    const matchStage = aggregate.mock.calls[0][0][0].$match;
    expect(matchStage).toMatchObject({ status: "approved", deletedAt: null });
  });

  it("is server-paginated: passes page/limit through and applies defaults", async () => {
    await get(`productId=${PRODUCT}&page=3&limit=5`);
    expect(paginate.mock.calls[0][1]).toMatchObject({ page: 3, limit: 5 });
    await get(`productId=${PRODUCT}`);
    expect(paginate.mock.calls[1][1]).toMatchObject({ page: 1, limit: 10 });
  });

  it("returns an empty page (not an error) beyond the last page", async () => {
    paginate.mockResolvedValue(page([], { page: 9, totalDocs: 4, totalPages: 1 }));
    const res = await get(`productId=${PRODUCT}&page=9`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.items).toEqual([]);
    expect(body.pagination.totalPages).toBe(1);
    expect(userFind).not.toHaveBeenCalled();
  });

  it("falls back to «کاربر» when the author has no (or no longer a) name", async () => {
    userFind.mockReturnValue(chain([]));
    const body = await (await get(`productId=${PRODUCT}`)).json();
    expect(body.data.items[0].displayName).toBe("کاربر");
  });

  it("validates the query (422) before touching the DB", async () => {
    for (const qs of [
      "",
      "productId=abc",
      `productId=${PRODUCT}&page=0`,
      `productId=${PRODUCT}&page=x`,
      `productId=${PRODUCT}&limit=0`,
      `productId=${PRODUCT}&limit=21`,
    ]) {
      expect((await get(qs)).status).toBe(422);
    }
    expect(productFindOne).not.toHaveBeenCalled();
    expect(paginate).not.toHaveBeenCalled();
  });

  it("returns 404 for an unknown / draft / deleted product", async () => {
    productFindOne.mockReturnValue(chain(null));
    const res = await get(`productId=${PRODUCT}`);
    expect(res.status).toBe(404);
    expect(paginate).not.toHaveBeenCalled();
  });

  it("only treats published and archived products as valid", async () => {
    await get(`productId=${PRODUCT}`);
    expect(productFindOne.mock.calls[0][0].status.$in).toEqual(["published", "archived"]);
  });
});
