import { describe, expect, it } from "vitest";
import { createCardAccountSchema, sendCardAccountSchema, updateCardAccountSchema } from "./card-accounts";

const validObjectId = "507f1f77bcf86cd799439011";

function validPayload(overrides: Record<string, unknown> = {}) {
  return {
    cardNumber: "6037991234567890",
    shabaNumber: "IR120570028180010956499103",
    bankId: validObjectId,
    accountNumber: "0123456789",
    ownerName: "فرش سقطچی",
    ...overrides,
  };
}

describe("createCardAccountSchema", () => {
  it("accepts a valid payload", () => {
    expect(createCardAccountSchema.safeParse(validPayload()).success).toBe(true);
  });

  it("rejects a card number that isn't 16 digits", () => {
    const result = createCardAccountSchema.safeParse(validPayload({ cardNumber: "1234" }));
    expect(result.success).toBe(false);
  });

  it("rejects a card number with non-digit characters", () => {
    const result = createCardAccountSchema.safeParse(
      validPayload({ cardNumber: "6037-9912-3456-7890" }),
    );
    expect(result.success).toBe(false);
  });

  it("rejects a too-short owner name", () => {
    const result = createCardAccountSchema.safeParse(validPayload({ ownerName: "ا" }));
    expect(result.success).toBe(false);
  });

  it("rejects an invalid shaba number", () => {
    const result = createCardAccountSchema.safeParse(validPayload({ shabaNumber: "12345" }));
    expect(result.success).toBe(false);
  });

  it("accepts a lowercase 'ir' shaba prefix and normalizes it", () => {
    const result = createCardAccountSchema.safeParse(
      validPayload({ shabaNumber: "ir120570028180010956499103" }),
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.shabaNumber.startsWith("IR")).toBe(true);
    }
  });

  it("rejects an invalid bankId", () => {
    const result = createCardAccountSchema.safeParse(validPayload({ bankId: "not-an-id" }));
    expect(result.success).toBe(false);
  });
});

describe("updateCardAccountSchema", () => {
  it("allows a partial payload", () => {
    const result = updateCardAccountSchema.safeParse({ isActive: false });
    expect(result.success).toBe(true);
  });
});

describe("sendCardAccountSchema", () => {
  it("accepts a valid mobile number", () => {
    expect(sendCardAccountSchema.safeParse({ phoneNumber: "09121234567" }).success).toBe(true);
  });

  it("rejects an invalid mobile number", () => {
    expect(sendCardAccountSchema.safeParse({ phoneNumber: "123" }).success).toBe(false);
  });
});
