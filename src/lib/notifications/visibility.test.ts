import { describe, expect, it } from "vitest";
import { buildVisibleFilter, isNotificationRead, resolveSeenAt } from "./visibility";

const now = new Date("2026-09-29T10:00:00Z");

describe("buildVisibleFilter", () => {
  it("guest sees only public notifications", () => {
    const f = buildVisibleFilter(now, null);
    expect(f.status).toBe("published");
    expect(f.publishAt).toEqual({ $lte: now });
    expect(JSON.stringify(f)).not.toContain('"user"');
    expect(f.$and).toContainEqual({ audience: "public" });
  });

  it("user sees public + only their own personal notifications", () => {
    const f = buildVisibleFilter(now, "u1");
    expect(f.$and).toContainEqual({
      $or: [{ audience: "public" }, { audience: "user", user: "u1" }],
    });
  });

  it("requires expiresAt to be empty or in the future", () => {
    const f = buildVisibleFilter(now, null);
    expect(f.$and).toContainEqual({ $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }] });
  });
});

describe("read state helpers", () => {
  const created = new Date("2026-09-01T00:00:00Z");

  it("uses user createdAt as baseline when notificationsSeenAt is missing", () => {
    expect(resolveSeenAt(undefined, created)).toEqual(created);
    expect(resolveSeenAt(null, created)).toEqual(created);
  });

  it("never goes earlier than createdAt", () => {
    expect(resolveSeenAt(new Date("2026-08-01T00:00:00Z"), created)).toEqual(created);
    const later = new Date("2026-09-10T00:00:00Z");
    expect(resolveSeenAt(later, created)).toEqual(later);
  });

  it("old notifications are read; newer ones need a read record", () => {
    const seen = new Date("2026-09-10T00:00:00Z");
    expect(isNotificationRead(new Date("2026-09-05T00:00:00Z"), seen, false)).toBe(true);
    expect(isNotificationRead(new Date("2026-09-11T00:00:00Z"), seen, false)).toBe(false);
    expect(isNotificationRead(new Date("2026-09-11T00:00:00Z"), seen, true)).toBe(true);
  });
});
