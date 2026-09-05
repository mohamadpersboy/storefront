import { describe, expect, it } from "vitest";
import { updateContactUsSchema } from "./contact-us";

describe("updateContactUsSchema", () => {
  it("accepts a fully empty payload (all fields optional)", () => {
    const result = updateContactUsSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("accepts valid full data with coordinates", () => {
    const result = updateContactUsSchema.safeParse({
      phone: "09121234567",
      secondaryPhone: "021-12345678",
      email: "info@saghchi.example",
      address: "تهران، خیابان ولیعصر",
      workingHours: "شنبه تا پنجشنبه، ۹ الی ۱۸",
      latitude: 35.7,
      longitude: 51.4,
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid email", () => {
    const result = updateContactUsSchema.safeParse({ email: "not-an-email" });
    expect(result.success).toBe(false);
  });

  it("accepts an empty string email", () => {
    const result = updateContactUsSchema.safeParse({ email: "" });
    expect(result.success).toBe(true);
  });

  it("rejects out-of-range latitude", () => {
    const result = updateContactUsSchema.safeParse({ latitude: 200 });
    expect(result.success).toBe(false);
  });

  it("rejects out-of-range longitude", () => {
    const result = updateContactUsSchema.safeParse({ longitude: -200 });
    expect(result.success).toBe(false);
  });

  it("accepts null coordinates", () => {
    const result = updateContactUsSchema.safeParse({ latitude: null, longitude: null });
    expect(result.success).toBe(true);
  });
});
