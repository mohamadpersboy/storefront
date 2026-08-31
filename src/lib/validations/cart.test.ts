import { describe, expect, it } from "vitest";
import { addCartItemSchema, updateCartItemSchema } from "./cart";

const validObjectId = "507f1f77bcf86cd799439011";

describe("addCartItemSchema", () => {
  it("accepts a valid payload", () => {
    const result = addCartItemSchema.safeParse({
      productId: validObjectId,
      variantId: validObjectId,
      quantity: 2,
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid productId", () => {
    const result = addCartItemSchema.safeParse({
      productId: "not-an-object-id",
      variantId: validObjectId,
      quantity: 1,
    });
    expect(result.success).toBe(false);
  });

  it("rejects a zero quantity", () => {
    const result = addCartItemSchema.safeParse({
      productId: validObjectId,
      variantId: validObjectId,
      quantity: 0,
    });
    expect(result.success).toBe(false);
  });

  it("rejects a negative quantity", () => {
    const result = addCartItemSchema.safeParse({
      productId: validObjectId,
      variantId: validObjectId,
      quantity: -1,
    });
    expect(result.success).toBe(false);
  });

  it("rejects a non-integer quantity", () => {
    const result = addCartItemSchema.safeParse({
      productId: validObjectId,
      variantId: validObjectId,
      quantity: 1.5,
    });
    expect(result.success).toBe(false);
  });

  it("rejects an unreasonably large quantity", () => {
    const result = addCartItemSchema.safeParse({
      productId: validObjectId,
      variantId: validObjectId,
      quantity: 100_000,
    });
    expect(result.success).toBe(false);
  });

  it("rejects a missing variantId", () => {
    const result = addCartItemSchema.safeParse({ productId: validObjectId, quantity: 1 });
    expect(result.success).toBe(false);
  });
});

describe("updateCartItemSchema", () => {
  it("accepts a valid positive integer quantity", () => {
    const result = updateCartItemSchema.safeParse({ quantity: 5 });
    expect(result.success).toBe(true);
  });

  it("rejects a zero quantity", () => {
    const result = updateCartItemSchema.safeParse({ quantity: 0 });
    expect(result.success).toBe(false);
  });

  it("rejects a missing quantity", () => {
    const result = updateCartItemSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
