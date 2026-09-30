import { describe, expect, it } from "vitest";
import { buildAdminCreate, buildAdminUpdate, canHardDelete, resolvePublishAt } from "./admin";
import { isNotificationRead, resolveSeenAt } from "./visibility";

const now = new Date("2026-09-29T10:00:00Z");
const base = {
  status: "draft" as const,
  publishAt: new Date("2026-09-20T00:00:00Z"),
  expiresAt: null,
  content: "<p>متن</p>",
  imageUrl: null,
};

describe("buildAdminUpdate", () => {
  it("sanitizes submitted content on the server", () => {
    const r = buildAdminUpdate(base, { content: '<p>x</p><script>alert(1)</script>' }, now);
    expect(r.ok && r.update.content).toBe("<p>x</p>");
  });

  it("publishing a draft without publishAt sets publishAt to now", () => {
    const r = buildAdminUpdate(base, { status: "published" }, now);
    expect(r.ok && r.update.publishAt).toEqual(now);
  });

  it("restoring an archived notification keeps its original publishAt", () => {
    const r = buildAdminUpdate({ ...base, status: "archived" }, { status: "published" }, now);
    expect(r.ok && r.update.publishAt).toBeUndefined();
  });

  it("rejects publishing empty content without an image", () => {
    const r = buildAdminUpdate(base, { content: "<p></p>", status: "published" }, now);
    expect(r).toMatchObject({ ok: false, field: "content" });
  });

  it("allows an empty draft", () => {
    expect(buildAdminUpdate(base, { content: "" }, now).ok).toBe(true);
  });

  it("rejects an expiry that is not after the publish time", () => {
    const r = buildAdminUpdate(
      base,
      { publishAt: new Date("2026-10-01T00:00:00Z"), expiresAt: new Date("2026-09-30T00:00:00Z") },
      now,
    );
    expect(r).toMatchObject({ ok: false, field: "expiresAt" });
  });

  it("only drafts can be hard-deleted", () => {
    expect(canHardDelete("draft")).toBe(true);
    expect(canHardDelete("published")).toBe(false);
    expect(canHardDelete("archived")).toBe(false);
  });
});

const TZ = "Asia/Tehran";
const live = { ...base, status: "published" as const, publishAt: new Date("2026-09-20T07:00:00Z") };
const createInput = { type: "announcement" as const, title: "عنوان", content: "<p>x</p>" };

describe("H1 — publishAt never lands in the past", () => {
  it("resolvePublishAt: past or equal → now; future stays", () => {
    const future = new Date("2026-10-05T00:00:00Z");
    expect(resolvePublishAt(new Date("2026-09-01T00:00:00Z"), now)).toEqual(now);
    expect(resolvePublishAt(now, now)).toEqual(now);
    expect(resolvePublishAt(future, now)).toEqual(future);
    expect(resolvePublishAt(null, now)).toEqual(now);
    expect(resolvePublishAt(undefined, now)).toEqual(now);
  });

  it("POST: admin selects TODAY and publishes → publishAt = now (immediate)", () => {
    const r = buildAdminCreate({ ...createInput, status: "published", publishAt: "2026-09-29" }, now, TZ);
    expect(r.ok && r.fields.publishAt).toEqual(now);
  });

  it("POST: a future date is kept, interpreted as start of that Tehran day", () => {
    const r = buildAdminCreate({ ...createInput, status: "published", publishAt: "2026-10-05" }, now, TZ);
    expect(r.ok && r.fields.publishAt.toISOString()).toBe("2026-10-04T20:30:00.000Z");
  });

  it("POST: no date → now; draft keeps the requested date as-is", () => {
    const pub = buildAdminCreate({ ...createInput, status: "published" }, now, TZ);
    expect(pub.ok && pub.fields.publishAt).toEqual(now);
    const draft = buildAdminCreate({ ...createInput, status: "draft", publishAt: "2026-09-01" }, now, TZ);
    expect(draft.ok && draft.fields.publishAt.toISOString()).toBe("2026-08-31T20:30:00.000Z");
  });

  it("PATCH draft→published with today's date → publishAt = now", () => {
    const r = buildAdminUpdate(base, { status: "published", publishAt: "2026-09-29" }, now, TZ);
    expect(r.ok && r.update.publishAt).toEqual(now);
  });

  it("PATCH draft→published keeps a stored FUTURE schedule, null clears it to now", () => {
    const scheduled = { ...base, publishAt: new Date("2026-10-05T00:00:00Z") };
    const kept = buildAdminUpdate(scheduled, { status: "published" }, now, TZ);
    expect(kept.ok && kept.update.publishAt).toEqual(scheduled.publishAt);
    const cleared = buildAdminUpdate(scheduled, { status: "published", publishAt: null }, now, TZ);
    expect(cleared.ok && cleared.update.publishAt).toEqual(now);
  });

  it("read semantics: user pressed read-all this morning, notification published today with today's date → UNREAD", () => {
    const readAllAt = new Date("2026-09-29T06:00:00Z");
    const built = buildAdminCreate({ ...createInput, status: "published", publishAt: "2026-09-29" }, now, TZ);
    if (!built.ok) throw new Error("expected ok");
    // before the fix: publishAt = 2026-09-28T20:30Z <= readAllAt → wrongly "read"
    expect(isNotificationRead(new Date("2026-09-28T20:30:00Z"), readAllAt, false)).toBe(true);
    expect(isNotificationRead(built.fields.publishAt, readAllAt, false)).toBe(false);
  });

  it("a brand-new user sees a notification published today as unread", () => {
    const userCreatedAt = new Date("2026-09-29T09:00:00Z");
    const built = buildAdminCreate({ ...createInput, status: "published", publishAt: "2026-09-29" }, now, TZ);
    if (!built.ok) throw new Error("expected ok");
    expect(isNotificationRead(built.fields.publishAt, resolveSeenAt(null, userCreatedAt), false)).toBe(false);
  });
});

describe("Low 3 — publishAt cannot move after publication", () => {
  it("live notification: moving publishAt into the future is rejected", () => {
    expect(buildAdminUpdate(live, { publishAt: "2026-10-10" }, now, TZ)).toMatchObject({ ok: false, field: "publishAt" });
    expect(buildAdminUpdate(live, { publishAt: new Date("2026-10-10T00:00:00Z") }, now, TZ)).toMatchObject({
      ok: false,
      field: "publishAt",
    });
  });

  it("live notification: an earlier/equal publishAt is ignored, the stored value stays", () => {
    const r = buildAdminUpdate(live, { publishAt: "2026-09-01", title: "new" }, now, TZ);
    expect(r.ok && r.update).not.toHaveProperty("publishAt");
    expect(r.ok && r.update.title).toBe("new");
    const same = buildAdminUpdate(live, { publishAt: live.publishAt }, now, TZ);
    expect(same.ok && same.update).not.toHaveProperty("publishAt");
  });

  it("archived-then-restored (was live) cannot be moved to the future either", () => {
    const archived = { ...live, status: "archived" as const };
    expect(buildAdminUpdate(archived, { status: "published", publishAt: "2026-10-10" }, now, TZ)).toMatchObject({
      ok: false,
      field: "publishAt",
    });
  });

  it("published but still scheduled (not yet visible) can be rescheduled freely", () => {
    const scheduled = { ...base, status: "published" as const, publishAt: new Date("2026-10-05T00:00:00Z") };
    const later = buildAdminUpdate(scheduled, { publishAt: "2026-10-20" }, now, TZ);
    expect(later.ok && later.update.publishAt?.toISOString()).toBe("2026-10-19T20:30:00.000Z");
    const immediate = buildAdminUpdate(scheduled, { publishAt: "2026-09-29" }, now, TZ);
    expect(immediate.ok && immediate.update.publishAt).toEqual(now);
  });
});

describe("Low 2 — expiry uses the end of the business day", () => {
  it("expiresAt date-only → 23:59:59.999 Tehran", () => {
    const r = buildAdminCreate({ ...createInput, status: "published", expiresAt: "2026-10-02" }, now, TZ);
    expect(r.ok && r.fields.expiresAt?.toISOString()).toBe("2026-10-02T20:29:59.999Z");
  });

  it("expiring today is valid (end of today > now); expiring yesterday is rejected", () => {
    expect(buildAdminCreate({ ...createInput, status: "published", expiresAt: "2026-09-29" }, now, TZ).ok).toBe(true);
    expect(buildAdminCreate({ ...createInput, status: "published", expiresAt: "2026-09-28" }, now, TZ)).toMatchObject({
      ok: false,
      field: "expiresAt",
    });
  });

  it("publish and expiry on the same day is valid (start-of-day vs end-of-day)", () => {
    expect(
      buildAdminCreate({ ...createInput, status: "draft", publishAt: "2026-10-05", expiresAt: "2026-10-05" }, now, TZ).ok,
    ).toBe(true);
  });

  it("PATCH: date-only expiry is converted, null clears it, omitted keeps it", () => {
    const set = buildAdminUpdate(live, { expiresAt: "2026-10-02" }, now, TZ);
    expect(set.ok && set.update.expiresAt?.toISOString()).toBe("2026-10-02T20:29:59.999Z");
    const cleared = buildAdminUpdate({ ...live, expiresAt: new Date("2026-10-02T20:29:59.999Z") }, { expiresAt: null }, now, TZ);
    expect(cleared.ok && cleared.update.expiresAt).toBeNull();
    const kept = buildAdminUpdate(live, { title: "x" }, now, TZ);
    expect(kept.ok && kept.update).not.toHaveProperty("expiresAt");
  });
});
