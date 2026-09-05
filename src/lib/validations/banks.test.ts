import { describe, expect, it } from "vitest";
import { createBankSchema, updateBankSchema } from "./banks";

describe("createBankSchema", () => {
  it("accepts a valid payload", () => {
    const result = createBankSchema.safeParse({ name: "بانک ملت" });
    expect(result.success).toBe(true);
  });

  it("rejects a name shorter than 2 characters", () => {
    const result = createBankSchema.safeParse({ name: "م" });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid logo URL", () => {
    const result = createBankSchema.safeParse({ name: "بانک ملت", logoUrl: "not-a-url" });
    expect(result.success).toBe(false);
  });

  it("accepts a null logoUrl", () => {
    const result = createBankSchema.safeParse({ name: "بانک ملت", logoUrl: null });
    expect(result.success).toBe(true);
  });
});

describe("updateBankSchema", () => {
  it("accepts a partial payload with only isActive", () => {
    const result = updateBankSchema.safeParse({ isActive: false });
    expect(result.success).toBe(true);
  });

  it("accepts an empty object", () => {
    const result = updateBankSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});
