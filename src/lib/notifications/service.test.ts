import { beforeEach, describe, expect, it, vi } from "vitest";

const create = vi.fn();
const insertMany = vi.fn();
vi.mock("@/models/Notification", () => ({
  Notification: { create: (...a: unknown[]) => create(...a), insertMany: (...a: unknown[]) => insertMany(...a) },
}));

import {
  buildNotificationDoc,
  createNotification,
  createNotifications,
  safeCreateNotification,
} from "./service";

beforeEach(() => {
  create.mockReset();
  insertMany.mockReset();
});

describe("buildNotificationDoc", () => {
  it("personal notifications are always plain text", () => {
    const doc = buildNotificationDoc({
      audience: "user",
      userId: "u1",
      type: "order",
      title: "t",
      content: "<script>x</script>",
      contentFormat: "html",
    });
    expect(doc.contentFormat).toBe("text");
    expect(doc.user).toBe("u1");
  });

  it("public html content is sanitized before storing", () => {
    const doc = buildNotificationDoc({
      audience: "public",
      type: "announcement",
      title: "t",
      content: '<p>ok</p><img src="x" onerror="1"><script>1</script>',
      contentFormat: "html",
    });
    expect(doc.content).toBe("<p>ok</p>");
    expect(doc.user).toBeNull();
  });

  it("drops unsafe link and image URLs", () => {
    const doc = buildNotificationDoc({
      audience: "public",
      type: "system",
      title: "t",
      link: "javascript:alert(1)",
      imageUrl: "http://insecure.test/a.png",
    });
    expect(doc.link).toBeNull();
    expect(doc.imageUrl).toBeNull();
  });

  it("requires userId for personal and forbids it for public", () => {
    expect(() => buildNotificationDoc({ audience: "user", type: "order", title: "t" })).toThrow();
    expect(() =>
      buildNotificationDoc({ audience: "public", userId: "u1", type: "system", title: "t" }),
    ).toThrow();
  });

  it("only sets dedupeKey when given", () => {
    expect(buildNotificationDoc({ audience: "public", type: "system", title: "t" })).not.toHaveProperty("dedupeKey");
    expect(
      buildNotificationDoc({ audience: "public", type: "system", title: "t", dedupeKey: "k" }).dedupeKey,
    ).toBe("k");
  });
});

describe("createNotification / duplicate prevention", () => {
  it("returns created:true with the new id", async () => {
    create.mockResolvedValue({ _id: "abc" });
    await expect(createNotification({ audience: "public", type: "system", title: "t" })).resolves.toEqual({
      created: true,
      id: "abc",
    });
  });

  it("treats a duplicate dedupeKey (E11000) as a no-op, not an error", async () => {
    create.mockRejectedValue({ code: 11000 });
    await expect(
      createNotification({ audience: "public", type: "system", title: "t", dedupeKey: "k" }),
    ).resolves.toEqual({ created: false, id: null });
  });

  it("rethrows other errors", async () => {
    create.mockRejectedValue(new Error("boom"));
    await expect(createNotification({ audience: "public", type: "system", title: "t" })).rejects.toThrow("boom");
  });

  it("safeCreateNotification never throws (best-effort)", async () => {
    create.mockRejectedValue(new Error("boom"));
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    await expect(
      safeCreateNotification({ audience: "public", type: "system", title: "t" }),
    ).resolves.toBeUndefined();
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});

describe("createNotifications (bulk)", () => {
  const inputs = [
    { audience: "user" as const, userId: "u1", type: "coupon_expiry" as const, title: "t", dedupeKey: "a" },
    { audience: "user" as const, userId: "u2", type: "coupon_expiry" as const, title: "t", dedupeKey: "b" },
  ];

  it("returns 0 for an empty list without touching the DB", async () => {
    await expect(createNotifications([])).resolves.toEqual({ created: 0 });
    expect(insertMany).not.toHaveBeenCalled();
  });

  it("counts inserted docs", async () => {
    insertMany.mockResolvedValue([{}, {}]);
    await expect(createNotifications(inputs)).resolves.toEqual({ created: 2 });
  });

  it("ignores duplicates and counts only new ones", async () => {
    insertMany.mockRejectedValue({ code: 11000, writeErrors: [{ code: 11000 }] });
    await expect(createNotifications(inputs)).resolves.toEqual({ created: 1 });
  });

  it("rethrows when a non-duplicate write error is present", async () => {
    insertMany.mockRejectedValue({ writeErrors: [{ code: 11000 }, { code: 121 }] });
    await expect(createNotifications(inputs)).rejects.toBeTruthy();
  });
});
