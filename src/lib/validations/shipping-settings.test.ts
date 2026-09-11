import { describe, expect, it } from "vitest";
import { updateShippingSettingsSchema } from "./shipping-settings";

describe("updateShippingSettingsSchema", () => {
  it("accepts a valid enabled payload", () => {
    const result = updateShippingSettingsSchema.safeParse({
      freeShippingEnabled: true,
      freeShippingThreshold: 500000,
    });
    expect(result.success).toBe(true);
  });

  it("accepts a valid disabled payload", () => {
    const result = updateShippingSettingsSchema.safeParse({
      freeShippingEnabled: false,
      freeShippingThreshold: 0,
    });
    expect(result.success).toBe(true);
  });

  it("rejects a negative threshold", () => {
    const result = updateShippingSettingsSchema.safeParse({
      freeShippingEnabled: true,
      freeShippingThreshold: -1,
    });
    expect(result.success).toBe(false);
  });

  it("rejects a missing freeShippingEnabled", () => {
    const result = updateShippingSettingsSchema.safeParse({
      freeShippingThreshold: 500000,
    });
    expect(result.success).toBe(false);
  });
});
