import { describe, expect, it } from "vitest";
import { updateTermsSchema } from "./terms";

describe("updateTermsSchema", () => {
  it("accepts valid data", () => {
    const result = updateTermsSchema.safeParse({
      title: "قوانین و مقررات",
      content: "متن کامل قوانین و مقررات فروشگاه",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a title shorter than 2 characters", () => {
    const result = updateTermsSchema.safeParse({
      title: "ا",
      content: "متن",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty content", () => {
    const result = updateTermsSchema.safeParse({
      title: "قوانین و مقررات",
      content: "",
    });
    expect(result.success).toBe(false);
  });
});
