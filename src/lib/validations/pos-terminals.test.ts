import { describe, expect, it } from "vitest";
import { createPosTerminalSchema, updatePosTerminalSchema } from "./pos-terminals";

const validObjectId = "507f1f77bcf86cd799439011";

function validPayload(overrides: Record<string, unknown> = {}) {
  return {
    name: "کارتخوان فروشگاه",
    bankId: validObjectId,
    accountNumber: "0123456789",
    ...overrides,
  };
}

describe("createPosTerminalSchema", () => {
  it("accepts a valid payload", () => {
    expect(createPosTerminalSchema.safeParse(validPayload()).success).toBe(true);
  });

  it("rejects an invalid bankId", () => {
    const result = createPosTerminalSchema.safeParse(validPayload({ bankId: "not-an-id" }));
    expect(result.success).toBe(false);
  });

  it("rejects a too-short name", () => {
    const result = createPosTerminalSchema.safeParse(validPayload({ name: "ک" }));
    expect(result.success).toBe(false);
  });
});

describe("updatePosTerminalSchema", () => {
  it("allows a partial payload", () => {
    const result = updatePosTerminalSchema.safeParse({ isActive: false });
    expect(result.success).toBe(true);
  });
});
