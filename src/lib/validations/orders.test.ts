import { describe, expect, it } from "vitest";
import { shippingAddressSchema } from "./orders";

function baseAddress(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    recipientName: "علی رضایی",
    phoneNumber: "09121234567",
    province: "تهران",
    city: "تهران",
    addressLine: "خیابان ولیعصر، پلاک ۱۲۳",
    postalCode: "1234567890",
    ...overrides,
  };
}

describe("shippingAddressSchema", () => {
  it("accepts a valid address without coordinates", () => {
    const result = shippingAddressSchema.safeParse(baseAddress());
    expect(result.success).toBe(true);
  });

  it("accepts a valid address with coordinates from the Neshan map picker", () => {
    const result = shippingAddressSchema.safeParse(
      baseAddress({ latitude: 35.699756, longitude: 51.338076 }),
    );
    expect(result.success).toBe(true);
  });

  it("rejects an out-of-range latitude", () => {
    const result = shippingAddressSchema.safeParse(baseAddress({ latitude: 200, longitude: 51 }));
    expect(result.success).toBe(false);
  });

  it("rejects an out-of-range longitude", () => {
    const result = shippingAddressSchema.safeParse(baseAddress({ latitude: 35, longitude: -200 }));
    expect(result.success).toBe(false);
  });

  it("rejects an invalid phone number", () => {
    const result = shippingAddressSchema.safeParse(baseAddress({ phoneNumber: "12345" }));
    expect(result.success).toBe(false);
  });

  it("rejects a missing province (no free-text bypass allowed, but empty is still invalid)", () => {
    const result = shippingAddressSchema.safeParse(baseAddress({ province: "" }));
    expect(result.success).toBe(false);
  });

  it("rejects a too-short postal code", () => {
    const result = shippingAddressSchema.safeParse(baseAddress({ postalCode: "123" }));
    expect(result.success).toBe(false);
  });
});
