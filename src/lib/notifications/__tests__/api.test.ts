import { beforeEach, describe, expect, it, vi } from "vitest";

const getCurrentUser = vi.fn();
const listVisible = vi.fn();
const countUnread = vi.fn();
const getVisible = vi.fn();
const markRead = vi.fn();
const markAll = vi.fn();
const createNotification = vi.fn();
const paginate = vi.fn();
const findOne = vi.fn();

vi.mock("@/lib/auth/current-user", () => ({ getCurrentUser: () => getCurrentUser() }));
vi.mock("@/lib/db/connect", () => ({ connectToDatabase: vi.fn() }));
vi.mock("@/lib/audit/log-activity", () => ({ logActivity: vi.fn() }));
vi.mock("@/lib/notifications/queries", () => ({
  viewerFromUser: (u: { id: string; createdAt: Date }) => ({ id: u.id, createdAt: u.createdAt }),
  listVisibleNotifications: (...a: unknown[]) => listVisible(...a),
  countUnreadNotifications: (...a: unknown[]) => countUnread(...a),
  getVisibleNotification: (...a: unknown[]) => getVisible(...a),
  markNotificationRead: (...a: unknown[]) => markRead(...a),
  markAllNotificationsRead: (...a: unknown[]) => markAll(...a),
}));
vi.mock("@/lib/notifications/service", () => ({
  createNotification: (...a: unknown[]) => createNotification(...a),
}));
vi.mock("@/models/Notification", () => ({
  Notification: {
    paginate: (...a: unknown[]) => paginate(...a),
    findOne: (...a: unknown[]) => findOne(...a),
  },
}));
vi.mock("@/models/NotificationRead", () => ({ NotificationRead: { deleteMany: vi.fn() } }));

import { GET as listGET } from "@/app/api/v1/notifications/route";
import { GET as unreadGET } from "@/app/api/v1/notifications/unread-count/route";
import { GET as detailGET } from "@/app/api/v1/notifications/[id]/route";
import { PATCH as readPATCH } from "@/app/api/v1/notifications/[id]/read/route";
import { PATCH as readAllPATCH } from "@/app/api/v1/notifications/read-all/route";
import { GET as manageGET, POST as managePOST } from "@/app/api/v1/notifications/manage/route";
import { DELETE as manageDELETE } from "@/app/api/v1/notifications/manage/[id]/route";
import { NextRequest } from "next/server";

const user = (role: string) => ({
  id: "u1",
  _id: "u1",
  role,
  createdAt: new Date("2026-09-01T00:00:00Z"),
  notificationsSeenAt: null,
});
const req = (url: string) => new NextRequest(`http://localhost${url}`);
const ctx = (id = "64b7f0c2a1b2c3d4e5f60718") => ({ params: Promise.resolve({ id }) });
const json = (body: unknown) =>
  new Request("http://localhost/x", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });

const emptyList = { items: [], pagination: { totalDocs: 0, totalPages: 0, page: 1, limit: 10, hasNextPage: false, hasPrevPage: false } };

beforeEach(() => {
  for (const f of [getCurrentUser, listVisible, countUnread, getVisible, markRead, markAll, createNotification, paginate, findOne]) f.mockReset();
  getCurrentUser.mockResolvedValue(null);
  listVisible.mockResolvedValue(emptyList);
});

describe("public/user API — Guest", () => {
  it("GET /notifications works for a guest and queries with viewer=null", async () => {
    const res = await listGET(req("/api/v1/notifications?page=1&limit=5"));
    expect(res.status).toBe(200);
    expect(listVisible).toHaveBeenCalledWith(expect.objectContaining({ viewer: null, page: 1, limit: 5 }));
    expect(res.headers.get("cache-control")).toBe("private, no-store");
  });

  it("rejects invalid pagination params with 422", async () => {
    expect((await listGET(req("/api/v1/notifications?page=0"))).status).toBe(422);
    expect((await listGET(req("/api/v1/notifications?limit=999"))).status).toBe(422);
  });

  it("unread-count is 0 for a guest and never hits the DB", async () => {
    const res = await unreadGET();
    expect((await res.json()).data).toEqual({ count: 0, authenticated: false });
    expect(countUnread).not.toHaveBeenCalled();
  });

  it("detail: guest gets 404 when the notification is not visible (e.g. personal)", async () => {
    getVisible.mockResolvedValue(null);
    const res = await detailGET(req("/x"), ctx());
    expect(res.status).toBe(404);
    expect(getVisible).toHaveBeenCalledWith(expect.objectContaining({ viewer: null }));
  });

  it("mark-read and read-all require login (401)", async () => {
    expect((await readPATCH(req("/x"), ctx())).status).toBe(401);
    expect((await readAllPATCH()).status).toBe(401);
    expect(markRead).not.toHaveBeenCalled();
    expect(markAll).not.toHaveBeenCalled();
  });
});

describe("public/user API — authenticated", () => {
  beforeEach(() => getCurrentUser.mockResolvedValue(user("customer")));

  it("lists with the current user as viewer (public + own personal)", async () => {
    await listGET(req("/api/v1/notifications"));
    expect(listVisible.mock.calls[0][0].viewer).toMatchObject({ id: "u1" });
  });

  it("returns the unread count", async () => {
    countUnread.mockResolvedValue(3);
    expect((await (await unreadGET()).json()).data).toEqual({ count: 3, authenticated: true });
  });

  it("mark-read: 200 when visible, 404 when it is someone else's/hidden", async () => {
    markRead.mockResolvedValueOnce(true).mockResolvedValueOnce(false);
    expect((await readPATCH(req("/x"), ctx())).status).toBe(200);
    expect((await readPATCH(req("/x"), ctx())).status).toBe(404);
  });

  it("read-all advances the baseline", async () => {
    expect((await readAllPATCH()).status).toBe(200);
    expect(markAll).toHaveBeenCalledTimes(1);
  });
});

describe("admin API authorization", () => {
  const validBody = { title: "جشنواره", content: "<p>متن</p>", status: "draft" };

  it("401 for guests", async () => {
    expect((await manageGET(req("/api/v1/notifications/manage"))).status).toBe(401);
    expect((await managePOST(json(validBody))).status).toBe(401);
  });

  it("403 for a customer and for staff (non-admin)", async () => {
    for (const role of ["customer", "staff"]) {
      getCurrentUser.mockResolvedValue(user(role));
      expect((await manageGET(req("/api/v1/notifications/manage"))).status).toBe(403);
      expect((await managePOST(json(validBody))).status).toBe(403);
      expect((await manageDELETE(req("/x"), ctx())).status).toBe(403);
    }
    expect(createNotification).not.toHaveBeenCalled();
  });

  it("admin can create; content is sanitized and audience is forced to public", async () => {
    getCurrentUser.mockResolvedValue(user("admin"));
    createNotification.mockResolvedValue({ created: true, id: "n1" });
    const res = await managePOST(
      json({ ...validBody, content: '<p>x</p><script>alert(1)</script>', status: "published" }),
    );
    expect(res.status).toBe(201);
    expect(createNotification).toHaveBeenCalledWith(
      expect.objectContaining({ audience: "public", content: "<p>x</p>", contentFormat: "html", status: "published" }),
    );
  });

  it("rejects javascript: links, empty content and bad expiry with 422", async () => {
    getCurrentUser.mockResolvedValue(user("admin"));
    expect((await managePOST(json({ ...validBody, link: "javascript:alert(1)" }))).status).toBe(422);
    expect((await managePOST(json({ ...validBody, content: "<script>1</script>" }))).status).toBe(422);
    expect(
      (
        await managePOST(
          json({ ...validBody, publishAt: "2026-10-02T00:00:00Z", expiresAt: "2026-10-01T00:00:00Z" }),
        )
      ).status,
    ).toBe(422);
    expect(createNotification).not.toHaveBeenCalled();
  });

  it("admin list only queries public notifications", async () => {
    getCurrentUser.mockResolvedValue(user("admin"));
    paginate.mockResolvedValue({ docs: [], totalDocs: 0, totalPages: 0, page: 1, limit: 10, hasNextPage: false, hasPrevPage: false });
    await manageGET(req("/api/v1/notifications/manage?status=draft"));
    expect(paginate.mock.calls[0][0]).toMatchObject({ audience: "public", status: "draft" });
  });

  it("published notifications cannot be hard-deleted (409); drafts can", async () => {
    getCurrentUser.mockResolvedValue(user("admin"));
    const deleteOne = vi.fn();
    findOne.mockResolvedValueOnce({ id: "n1", _id: "n1", title: "t", status: "published", deleteOne });
    expect((await manageDELETE(req("/x"), ctx())).status).toBe(409);
    expect(deleteOne).not.toHaveBeenCalled();

    findOne.mockResolvedValueOnce({ id: "n2", _id: "n2", title: "t", status: "draft", deleteOne });
    expect((await manageDELETE(req("/x"), ctx())).status).toBe(200);
    expect(deleteOne).toHaveBeenCalledTimes(1);
  });
});
