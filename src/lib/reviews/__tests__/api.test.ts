import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const getCurrentUser = vi.fn();
const createReview = vi.fn();
const deleteOwnReview = vi.fn();
const adminDeleteReview = vi.fn();
const moderateReview = vi.fn();
const checkUpload = vi.fn();
const listAdmin = vi.fn();
const getDetail = vi.fn();
const logActivity = vi.fn();

vi.mock("@/lib/auth/current-user", () => ({ getCurrentUser: () => getCurrentUser() }));
vi.mock("@/lib/db/connect", () => ({ connectToDatabase: vi.fn() }));
vi.mock("@/lib/audit/log-activity", () => ({ logActivity: (...a: unknown[]) => logActivity(...a) }));
vi.mock("@/lib/reviews/service", () => ({
  createReview: (...a: unknown[]) => createReview(...a),
  deleteOwnReview: (...a: unknown[]) => deleteOwnReview(...a),
  adminDeleteReview: (...a: unknown[]) => adminDeleteReview(...a),
  moderateReview: (...a: unknown[]) => moderateReview(...a),
  checkReviewImageUploadEligibility: (...a: unknown[]) => checkUpload(...a),
}));
vi.mock("@/lib/reviews/queries", () => ({
  listAdminReviews: (...a: unknown[]) => listAdmin(...a),
  getAdminReviewDetail: (...a: unknown[]) => getDetail(...a),
}));
vi.mock("@/lib/cloudinary/config", () => ({
  cloudinary: { utils: { api_sign_request: () => "sig" } },
  PRODUCT_IMAGES_FOLDER: "p",
  BANK_LOGOS_FOLDER: "b",
  BANNER_IMAGES_FOLDER: "n",
  CATEGORY_IMAGES_FOLDER: "c",
  BRAND_IMAGES_FOLDER: "br",
  NOTIFICATION_IMAGES_FOLDER: "no",
  REVIEW_IMAGES_FOLDER: "saghchi-carpet/reviews",
}));

import { POST as createPOST } from "@/app/api/v1/reviews/route";
import { DELETE as ownDELETE } from "@/app/api/v1/reviews/[id]/route";
import { GET as adminGET } from "@/app/api/v1/reviews/admin/route";
import { GET as detailGET, DELETE as adminDELETE } from "@/app/api/v1/reviews/admin/[id]/route";
import { POST as approvePOST } from "@/app/api/v1/reviews/admin/[id]/approve/route";
import { POST as rejectPOST } from "@/app/api/v1/reviews/admin/[id]/reject/route";
import { POST as signPOST } from "@/app/api/v1/uploads/sign/route";

const PRODUCT = "64b7f0c2a1b2c3d4e5f60718";
const RID = "64b7f0c2a1b2c3d4e5f60888";
const user = (role: string) => ({ id: "u1", role, fullName: "n", phoneNumber: "0912" });
const ctx = { params: Promise.resolve({ id: RID }) };
const post = (body: unknown, raw?: string) =>
  new Request("http://localhost/x", {
    method: "POST",
    body: raw ?? JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
const valid = { productId: PRODUCT, text: "خوب", rating: 5, recommendation: "recommend" };

beforeEach(() => {
  for (const f of [getCurrentUser, createReview, deleteOwnReview, adminDeleteReview, moderateReview, checkUpload, listAdmin, getDetail, logActivity]) f.mockReset();
  getCurrentUser.mockResolvedValue(null);
});

describe("customer API", () => {
  it("requires authentication (401)", async () => {
    expect((await createPOST(post(valid))).status).toBe(401);
    expect((await ownDELETE(new Request("http://localhost/x"), ctx)).status).toBe(401);
  });

  it("validates the body (422) without calling the service", async () => {
    getCurrentUser.mockResolvedValue(user("customer"));
    expect((await createPOST(post({ ...valid, rating: 6 }))).status).toBe(422);
    expect((await createPOST(post({ ...valid, text: "ا".repeat(481) }))).status).toBe(422);
    expect(createReview).not.toHaveBeenCalled();
  });

  it("creates a review (201) using the session user, ignoring client-sent trust fields", async () => {
    getCurrentUser.mockResolvedValue(user("customer"));
    createReview.mockResolvedValue({ ok: true, data: { id: "r1", status: "pending", isVerifiedBuyer: false } });
    const res = await createPOST(post({ ...valid, status: "approved", isVerifiedBuyer: true }));
    expect(res.status).toBe(201);
    const [userId, input] = createReview.mock.calls[0];
    expect(userId).toBe("u1");
    expect(input).not.toHaveProperty("status");
    expect(input).not.toHaveProperty("isVerifiedBuyer");
  });

  it("maps service failures to their status (409 duplicate)", async () => {
    getCurrentUser.mockResolvedValue(user("customer"));
    createReview.mockResolvedValue({ ok: false, status: 409, message: "dup" });
    expect((await createPOST(post(valid))).status).toBe(409);
  });

  it("deletes own review, and returns 404 for another user's", async () => {
    getCurrentUser.mockResolvedValue(user("customer"));
    deleteOwnReview.mockResolvedValue({ ok: true, data: { id: RID } });
    expect((await ownDELETE(new Request("http://localhost/x"), ctx)).status).toBe(200);
    expect(deleteOwnReview).toHaveBeenCalledWith("u1", RID);
    deleteOwnReview.mockResolvedValue({ ok: false, status: 404, message: "x" });
    expect((await ownDELETE(new Request("http://localhost/x"), ctx)).status).toBe(404);
  });
});

describe("admin API authorization", () => {
  it("blocks customers from every admin route (403)", async () => {
    getCurrentUser.mockResolvedValue(user("customer"));
    expect((await adminGET(new NextRequest("http://localhost/api/v1/reviews/admin"))).status).toBe(403);
    expect((await detailGET(new Request("http://localhost/x"), ctx)).status).toBe(403);
    expect((await approvePOST(post({}), ctx)).status).toBe(403);
    expect((await rejectPOST(post({}), ctx)).status).toBe(403);
    expect((await adminDELETE(new Request("http://localhost/x"), ctx)).status).toBe(403);
  });

  it("lets staff read but not moderate or delete", async () => {
    getCurrentUser.mockResolvedValue(user("staff"));
    listAdmin.mockResolvedValue({ docs: [], totalDocs: 0, totalPages: 0, page: 1, limit: 10, hasNextPage: false, hasPrevPage: false });
    expect((await adminGET(new NextRequest("http://localhost/api/v1/reviews/admin"))).status).toBe(200);
    expect((await approvePOST(post({}), ctx)).status).toBe(403);
    expect((await rejectPOST(post({}), ctx)).status).toBe(403);
    expect((await adminDELETE(new Request("http://localhost/x"), ctx)).status).toBe(403);
    expect(moderateReview).not.toHaveBeenCalled();
  });

  it("lets admin and super admin approve, reject and delete, with activity logs", async () => {
    for (const role of ["admin", "super_admin"]) {
      getCurrentUser.mockResolvedValue(user(role));
      moderateReview.mockResolvedValue({ ok: true, data: { id: RID, status: "approved" } });
      adminDeleteReview.mockResolvedValue({ ok: true, data: { id: RID } });
      expect((await approvePOST(post({}), ctx)).status).toBe(200);
      expect((await rejectPOST(post({ rejectionReason: "نامناسب" }), ctx)).status).toBe(200);
      expect((await adminDELETE(new Request("http://localhost/x"), ctx)).status).toBe(200);
    }
    expect(moderateReview).toHaveBeenCalledWith(expect.objectContaining({ to: "rejected", rejectionReason: "نامناسب" }));
    expect(logActivity.mock.calls.map((c) => c[0].action)).toEqual(
      expect.arrayContaining(["review.approved", "review.rejected", "review.deleted"]),
    );
  });

  it("accepts reject without a body, and rejects malformed JSON or a too-long reason", async () => {
    getCurrentUser.mockResolvedValue(user("admin"));
    moderateReview.mockResolvedValue({ ok: true, data: { id: RID, status: "rejected" } });
    expect((await rejectPOST(post(null, ""), ctx)).status).toBe(200);
    expect(moderateReview).toHaveBeenLastCalledWith(expect.objectContaining({ rejectionReason: null }));
    expect((await rejectPOST(post(null, "{bad"), ctx)).status).toBe(422);
    expect((await rejectPOST(post({ rejectionReason: "ا".repeat(301) }), ctx)).status).toBe(422);
  });

  it("propagates 409 for invalid transitions", async () => {
    getCurrentUser.mockResolvedValue(user("admin"));
    moderateReview.mockResolvedValue({ ok: false, status: 409, message: "x" });
    expect((await approvePOST(post({}), ctx)).status).toBe(409);
  });

  it("returns 404 for a missing review detail", async () => {
    getCurrentUser.mockResolvedValue(user("staff"));
    getDetail.mockResolvedValue(null);
    expect((await detailGET(new Request("http://localhost/x"), ctx)).status).toBe(404);
  });

  it("validates admin list filters (422)", async () => {
    getCurrentUser.mockResolvedValue(user("staff"));
    expect((await adminGET(new NextRequest("http://localhost/x?rating=9"))).status).toBe(422);
    expect((await adminGET(new NextRequest("http://localhost/x?status=bogus"))).status).toBe(422);
  });
});

describe("POST /uploads/sign — review-image target", () => {
  const sign = (body: unknown) => signPOST(post(body));

  it("requires login", async () => {
    expect((await sign({ target: "review-image", productId: PRODUCT })).status).toBe(401);
  });

  it("does not hand out signatures without eligibility (not just any customer)", async () => {
    getCurrentUser.mockResolvedValue(user("customer"));
    checkUpload.mockResolvedValue({ ok: false, status: 403, message: "no" });
    expect((await sign({ target: "review-image", productId: PRODUCT })).status).toBe(403);
  });

  it("validates productId", async () => {
    getCurrentUser.mockResolvedValue(user("customer"));
    expect((await sign({ target: "review-image" })).status).toBe(422);
    expect(checkUpload).not.toHaveBeenCalled();
  });

  it("signs into the user's own review folder for an eligible buyer", async () => {
    getCurrentUser.mockResolvedValue(user("customer"));
    checkUpload.mockResolvedValue({ ok: true, data: null });
    const res = await sign({ target: "review-image", productId: PRODUCT });
    expect(res.status).toBe(200);
    expect((await res.json()).data.folder).toBe("saghchi-carpet/reviews/u1");
  });

  it("still requires admin permission for the other targets", async () => {
    getCurrentUser.mockResolvedValue(user("customer"));
    expect((await sign({ target: "product-image" })).status).toBe(403);
  });
});
