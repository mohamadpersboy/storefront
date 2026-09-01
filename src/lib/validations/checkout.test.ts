import { describe, expect, it } from "vitest";
import { checkoutSchema } from "./checkout";

function baseBody(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    shippingAddress: {
      recipientName: "علی رضایی",
      phoneNumber: "09121234567",
      province: "تهران",
      city: "تهران",
      addressLine: "خیابان ولیعصر، پلاک ۱۲۳",
      postalCode: "1234567890",
    },
    paymentMethod: "online",
    ...overrides,
  };
}

describe("checkoutSchema", () => {
  it("accepts a minimal valid payload with defaults applied", () => {
    const result = checkoutSchema.safeParse(baseBody());
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.shippingCost).toBe(0);
      expect(result.data.useWallet).toBe(false);
      expect(result.data.notes).toBe("");
    }
  });

  it("accepts useWallet: true and a prepaymentPercent for split payment method", () => {
    const result = checkoutSchema.safeParse(
      baseBody({ paymentMethod: "split", prepaymentPercent: 50, useWallet: true }),
    );
    expect(result.success).toBe(true);
  });

  it("rejects an invalid paymentMethod", () => {
    const result = checkoutSchema.safeParse(baseBody({ paymentMethod: "crypto" }));
    expect(result.success).toBe(false);
  });

  it("rejects a prepaymentPercent above 100", () => {
    const result = checkoutSchema.safeParse(baseBody({ prepaymentPercent: 150 }));
    expect(result.success).toBe(false);
  });

  it("rejects a negative shippingCost", () => {
    const result = checkoutSchema.safeParse(baseBody({ shippingCost: -1000 }));
    expect(result.success).toBe(false);
  });

  it("rejects an invalid shippingAddress", () => {
    const result = checkoutSchema.safeParse(
      baseBody({ shippingAddress: { ...baseBody().shippingAddress, province: "" } }),
    );
    expect(result.success).toBe(false);
  });
});
