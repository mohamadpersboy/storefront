import { beforeEach, describe, expect, it, vi } from "vitest";

const paginate = vi.fn();
const countDocuments = vi.fn();
const notifExists = vi.fn();
const notifFindOne = vi.fn();
const readFind = vi.fn();
const readExists = vi.fn();
const readUpdateOne = vi.fn();
const userUpdateOne = vi.fn();

vi.mock("@/models/Notification", () => ({
  Notification: {
    paginate: (...a: unknown[]) => paginate(...a),
    countDocuments: (...a: unknown[]) => countDocuments(...a),
    exists: (...a: unknown[]) => notifExists(...a),
    findOne: (...a: unknown[]) => notifFindOne(...a),
  },
}));
vi.mock("@/models/NotificationRead", () => ({
  NotificationRead: {
    find: (...a: unknown[]) => readFind(...a),
    exists: (...a: unknown[]) => readExists(...a),
    updateOne: (...a: unknown[]) => readUpdateOne(...a),
  },
}));
vi.mock("@/models/User", () => ({ User: { updateOne: (...a: unknown[]) => userUpdateOne(...a) } }));

import {
  countUnreadNotifications,
  getVisibleNotification,
  listVisibleNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "./queries";

const now = new Date("2026-09-29T10:00:00Z");
const ID = "64b7f0c2a1b2c3d4e5f60718";
const viewer = { id: "u1", createdAt: new Date("2026-09-01T00:00:00Z"), notificationsSeenAt: null };

const readChain = (rows: unknown[]) => ({ select: () => ({ lean: () => Promise.resolve(rows) }) });
const doc = (over: Record<string, unknown> = {}) => ({
  _id: ID,
  audience: "public",
  type: "announcement",
  title: "t",
  content: "<p>x</p>",
  contentFormat: "html",
  imageUrl: null,
  link: null,
  publishAt: new Date("2026-09-15T00:00:00Z"),
  expiresAt: null,
  ...over,
});

beforeEach(() => {
  for (const f of [paginate, countDocuments, notifExists, notifFindOne, readFind, readExists, readUpdateOne, userUpdateOne]) f.mockReset();
});

describe("listVisibleNotifications", () => {
  const page = (docs: unknown[]) => ({
    docs,
    totalDocs: docs.length,
    totalPages: 1,
    page: 1,
    limit: 10,
    hasNextPage: false,
    hasPrevPage: false,
  });

  it("guest: public filter, sorted newest first, everything shown as read", async () => {
    paginate.mockResolvedValue(page([doc()]));
    const res = await listVisibleNotifications({ viewer: null, page: 1, limit: 10, now });
    const [filter, options] = paginate.mock.calls[0];
    expect(filter.$and).toContainEqual({ audience: "public" });
    expect(options.sort).toEqual({ publishAt: -1, _id: -1 });
    expect(res.items[0].isRead).toBe(true);
    expect(readFind).not.toHaveBeenCalled();
  });

  it("user: marks unread when newer than baseline and without a read record", async () => {
    paginate.mockResolvedValue(page([doc({ publishAt: new Date("2026-09-20T00:00:00Z") })]));
    readFind.mockReturnValue(readChain([]));
    const res = await listVisibleNotifications({ viewer, page: 1, limit: 10, now });
    expect(res.items[0].isRead).toBe(false);
  });

  it("user: read record makes it read; old notifications are read via baseline", async () => {
    paginate.mockResolvedValue(
      page([
        doc({ _id: "a1", publishAt: new Date("2026-09-20T00:00:00Z") }),
        doc({ _id: "b2", publishAt: new Date("2026-08-01T00:00:00Z") }),
        doc({ _id: "c3", publishAt: new Date("2026-09-21T00:00:00Z") }),
      ]),
    );
    readFind.mockReturnValue(readChain([{ notification: "a1" }]));
    const res = await listVisibleNotifications({ viewer, page: 1, limit: 10, now });
    expect(res.items.map((i) => i.isRead)).toEqual([true, true, false]);
  });

  it("returns standard pagination info", async () => {
    paginate.mockResolvedValue({ ...page([]), totalDocs: 25, totalPages: 3, page: 2, hasNextPage: true, hasPrevPage: true });
    const res = await listVisibleNotifications({ viewer: null, page: 2, limit: 10, now });
    expect(res.pagination).toMatchObject({ totalDocs: 25, totalPages: 3, page: 2, hasNextPage: true, hasPrevPage: true });
  });

  it("passes the requested page and limit (empty page is fine)", async () => {
    paginate.mockResolvedValue(page([]));
    const res = await listVisibleNotifications({ viewer: null, page: 5, limit: 10, now });
    expect(paginate.mock.calls[0][1]).toMatchObject({ page: 5, limit: 10 });
    expect(res.items).toEqual([]);
  });
});

describe("countUnreadNotifications", () => {
  it("counts only visible notifications newer than the baseline", async () => {
    countDocuments.mockResolvedValueOnce(4);
    readFind.mockReturnValue(readChain([]));
    await expect(countUnreadNotifications(viewer, now)).resolves.toBe(4);
    const filter = countDocuments.mock.calls[0][0];
    expect(filter.status).toBe("published");
    expect(filter.publishAt).toEqual({ $lte: now, $gt: viewer.createdAt });
  });

  it("subtracts individually-read notifications", async () => {
    countDocuments.mockResolvedValueOnce(4).mockResolvedValueOnce(1);
    readFind.mockReturnValue(readChain([{ notification: "n1" }]));
    await expect(countUnreadNotifications(viewer, now)).resolves.toBe(3);
  });

  it("uses notificationsSeenAt as the new baseline after read-all", async () => {
    const seen = new Date("2026-09-25T00:00:00Z");
    countDocuments.mockResolvedValueOnce(0);
    await countUnreadNotifications({ ...viewer, notificationsSeenAt: seen }, now);
    expect(countDocuments.mock.calls[0][0].publishAt.$gt).toEqual(seen);
  });

  it("returns 0 without extra queries when nothing is unseen", async () => {
    countDocuments.mockResolvedValueOnce(0);
    await expect(countUnreadNotifications(viewer, now)).resolves.toBe(0);
    expect(readFind).not.toHaveBeenCalled();
  });
});

describe("getVisibleNotification", () => {
  it("returns null for an invalid id without querying", async () => {
    await expect(getVisibleNotification({ id: "nope", viewer: null, now })).resolves.toBeNull();
    expect(notifFindOne).not.toHaveBeenCalled();
  });

  it("applies the visibility filter with the viewer (user isolation)", async () => {
    notifFindOne.mockReturnValue({ lean: () => Promise.resolve(null) });
    await expect(getVisibleNotification({ id: ID, viewer, now })).resolves.toBeNull();
    const filter = notifFindOne.mock.calls[0][0];
    expect(filter._id).toBe(ID);
    expect(filter.$and).toContainEqual({
      $or: [{ audience: "public" }, { audience: "user", user: "u1" }],
    });
  });

  it("guest detail lookup can never match a personal notification", async () => {
    notifFindOne.mockReturnValue({ lean: () => Promise.resolve(doc()) });
    await getVisibleNotification({ id: ID, viewer: null, now });
    expect(notifFindOne.mock.calls[0][0].$and).toContainEqual({ audience: "public" });
  });

  it("returns sanitized full content", async () => {
    notifFindOne.mockReturnValue({
      lean: () => Promise.resolve(doc({ content: "<p>ok</p><script>x</script>" })),
    });
    readExists.mockResolvedValue(null);
    const res = await getVisibleNotification({ id: ID, viewer, now });
    expect(res?.content).toBe("<p>ok</p>");
  });
});

describe("markNotificationRead", () => {
  it("returns false and writes nothing if the notification is not visible to the user", async () => {
    notifExists.mockResolvedValue(null);
    await expect(markNotificationRead(viewer, ID, now)).resolves.toBe(false);
    expect(readUpdateOne).not.toHaveBeenCalled();
  });

  it("upserts a single read record (idempotent)", async () => {
    notifExists.mockResolvedValue({ _id: ID });
    await expect(markNotificationRead(viewer, ID, now)).resolves.toBe(true);
    expect(readUpdateOne).toHaveBeenCalledWith(
      { user: "u1", notification: ID },
      { $setOnInsert: { readAt: now } },
      { upsert: true },
    );
  });

  it("rejects an invalid id", async () => {
    await expect(markNotificationRead(viewer, "bad", now)).resolves.toBe(false);
  });
});

describe("markAllNotificationsRead", () => {
  it("only advances notificationsSeenAt with $max — no per-notification updates", async () => {
    await markAllNotificationsRead(viewer, now);
    expect(userUpdateOne).toHaveBeenCalledWith({ _id: "u1" }, { $max: { notificationsSeenAt: now } });
    expect(readUpdateOne).not.toHaveBeenCalled();
  });
});
