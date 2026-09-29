import { describe, expect, it } from "vitest";
import { isSafeNotificationImageUrl, isSafeNotificationLink } from "./links";

describe("isSafeNotificationLink", () => {
  it.each(["/orders/123", "/", "https://example.com/a?b=1"])("accepts %s", (v) => {
    expect(isSafeNotificationLink(v)).toBe(true);
  });

  it.each([
    "javascript:alert(1)",
    "data:text/html,x",
    "http://example.com",
    "//evil.test",
    "/\\evil.test",
    "/a b",
    "",
    "orders/1",
  ])("rejects %s", (v) => {
    expect(isSafeNotificationLink(v)).toBe(false);
  });
});

describe("isSafeNotificationImageUrl", () => {
  it("accepts only https Cloudinary URLs", () => {
    expect(isSafeNotificationImageUrl("https://res.cloudinary.com/x.jpg")).toBe(true);
    expect(isSafeNotificationImageUrl("https://evil.test/a.jpg")).toBe(false);
    expect(isSafeNotificationImageUrl("http://res.cloudinary.com/a.jpg")).toBe(false);
    expect(isSafeNotificationImageUrl("/local.jpg")).toBe(false);
  });
});
