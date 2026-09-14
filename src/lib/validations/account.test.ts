import { describe, expect, it } from "vitest";
import { updateProfileSchema } from "./account";

describe("updateProfileSchema", () => {
  it("accepts a valid full name", () => {
    const result = updateProfileSchema.safeParse({ fullName: "علی محمدی" });
    expect(result.success).toBe(true);
  });

  it("rejects a full name shorter than 2 characters", () => {
    const result = updateProfileSchema.safeParse({ fullName: "ع" });
    expect(result.success).toBe(false);
  });

  it("rejects a missing full name", () => {
    const result = updateProfileSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
