import { describe, expect, it } from "vitest";
import { createAddressSchema, updateAddressSchema } from "./addresses";

const VALID_ADDRESS = {
  title: "خانه",
  recipientName: "علی محمدی",
  phoneNumber: "09121234567",
  province: "تهران",
  city: "تهران",
  addressLine: "خیابان ولیعصر، کوچه یکم، پلاک ۵",
  postalCode: "1234567890",
};

describe("createAddressSchema", () => {
  it("accepts a valid address payload", () => {
    const result = createAddressSchema.safeParse(VALID_ADDRESS);
    expect(result.success).toBe(true);
  });

  it("accepts optional latitude/longitude/isDefault", () => {
    const result = createAddressSchema.safeParse({
      ...VALID_ADDRESS,
      latitude: 35.7,
      longitude: 51.4,
      isDefault: true,
    });
    expect(result.success).toBe(true);
  });

  it("rejects a title shorter than 2 characters", () => {
    const result = createAddressSchema.safeParse({ ...VALID_ADDRESS, title: "خ" });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid phone number", () => {
    const result = createAddressSchema.safeParse({ ...VALID_ADDRESS, phoneNumber: "12345" });
    expect(result.success).toBe(false);
  });

  it("rejects a missing province", () => {
    const rest = { ...VALID_ADDRESS } as Partial<typeof VALID_ADDRESS>;
    delete rest.province;
    const result = createAddressSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });
});

describe("updateAddressSchema", () => {
  it("accepts a partial payload with only isDefault", () => {
    const result = updateAddressSchema.safeParse({ isDefault: true });
    expect(result.success).toBe(true);
  });

  it("still rejects an invalid field when provided", () => {
    const result = updateAddressSchema.safeParse({ phoneNumber: "invalid" });
    expect(result.success).toBe(false);
  });
});
