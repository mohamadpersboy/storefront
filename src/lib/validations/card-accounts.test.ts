import { describe, expect, it } from "vitest";
import { createCardAccountSchema, updateCardAccountSchema } from "./card-accounts";

function validPayload(overrides: Record<string, unknown> = {}) {
  return {
    cardNumber: "6037991234567890",
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
});

describe("updateCardAccountSchema", () => {
  it("allows a partial payload", () => {
    const result = updateCardAccountSchema.safeParse({ isActive: false });
    expect(result.success).toBe(true);
  });
});
