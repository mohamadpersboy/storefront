import { describe, expect, it } from "vitest";
import {
  adminNotificationsListQuerySchema,
  createNotificationSchema,
  notificationsListQuerySchema,
  updateNotificationSchema,
} from "./notifications";

describe("notification validation", () => {
  it("defaults list pagination to page 1 / limit 10", () => {
    expect(notificationsListQuerySchema.parse({})).toEqual({ page: 1, limit: 10 });
  });

  it("create: minimal valid body defaults to a draft announcement", () => {
    const r = createNotificationSchema.parse({ title: "عنوان", content: "<p>x</p>" });
    expect(r).toMatchObject({ type: "announcement", status: "draft" });
  });

  it("create: cannot use personal-only types or the archived status", () => {
    expect(createNotificationSchema.safeParse({ title: "ab", type: "order" }).success).toBe(false);
    expect(createNotificationSchema.safeParse({ title: "ab", status: "archived" }).success).toBe(false);
  });

  it("accepts internal and https links, rejects unsafe ones", () => {
    for (const link of ["/categories", "https://a.test/x"]) {
      expect(createNotificationSchema.safeParse({ title: "ab", link }).success).toBe(true);
    }
    for (const link of ["javascript:alert(1)", "http://a.test", "//a.test"]) {
      expect(createNotificationSchema.safeParse({ title: "ab", link }).success).toBe(false);
    }
  });

  it("empty-string link/image become null", () => {
    const r = createNotificationSchema.parse({ title: "ab", link: "", imageUrl: "" });
    expect(r.link).toBeNull();
    expect(r.imageUrl).toBeNull();
  });

  it("expiry must be after publish", () => {
    expect(
      createNotificationSchema.safeParse({
        title: "ab",
        publishAt: "2026-10-02T00:00:00Z",
        expiresAt: "2026-10-01T00:00:00Z",
      }).success,
    ).toBe(false);
  });

  it("update is partial and allows archiving", () => {
    expect(updateNotificationSchema.parse({ status: "archived" })).toEqual({ status: "archived" });
  });

  it("admin list query accepts filters and rejects unknown status", () => {
    expect(adminNotificationsListQuerySchema.safeParse({ status: "published", type: "coupon", search: "ab" }).success).toBe(true);
    expect(adminNotificationsListQuerySchema.safeParse({ status: "weird" }).success).toBe(false);
  });
});
