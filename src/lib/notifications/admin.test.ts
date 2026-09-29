import { describe, expect, it } from "vitest";
import { buildAdminUpdate, canHardDelete } from "./admin";

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
