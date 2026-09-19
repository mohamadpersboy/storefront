import { describe, expect, it } from "vitest";
import { toggleFavoriteSchema } from "./favorites";

describe("toggleFavoriteSchema", () => {
  it("accepts a valid 24-char hex ObjectId", () => {
    const result = toggleFavoriteSchema.safeParse({ productId: "507f1f77bcf86cd799439011" });
    expect(result.success).toBe(true);
  });

  it("rejects a missing productId", () => {
    const result = toggleFavoriteSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects a productId that is too short", () => {
    const result = toggleFavoriteSchema.safeParse({ productId: "abc123" });
    expect(result.success).toBe(false);
  });

  it("rejects a productId with non-hex characters", () => {
    const result = toggleFavoriteSchema.safeParse({ productId: "zzzzzzzzzzzzzzzzzzzzzzzz" });
    expect(result.success).toBe(false);
  });

  it("rejects a non-string productId", () => {
    const result = toggleFavoriteSchema.safeParse({ productId: 12345 });
    expect(result.success).toBe(false);
  });
});
