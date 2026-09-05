import { describe, expect, it } from "vitest";
import { createFaqSchema, updateFaqSchema } from "./faqs";

describe("createFaqSchema", () => {
  it("accepts a valid question/answer pair", () => {
    const result = createFaqSchema.safeParse({
      question: "هزینه ارسال چقدر است؟",
      answer: "هزینه ارسال بر اساس مقصد محاسبه می‌شود.",
    });
    expect(result.success).toBe(true);
  });

  it("defaults isActive to true and sortOrder to 0", () => {
    const result = createFaqSchema.safeParse({
      question: "سوال نمونه",
      answer: "پاسخ نمونه",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isActive).toBe(true);
      expect(result.data.sortOrder).toBe(0);
    }
  });

  it("rejects a question shorter than 3 characters", () => {
    const result = createFaqSchema.safeParse({ question: "ab", answer: "پاسخ کافی" });
    expect(result.success).toBe(false);
  });

  it("rejects an answer shorter than 3 characters", () => {
    const result = createFaqSchema.safeParse({ question: "سوال کافی", answer: "ab" });
    expect(result.success).toBe(false);
  });

  it("rejects a missing question", () => {
    const result = createFaqSchema.safeParse({ answer: "پاسخ کافی" });
    expect(result.success).toBe(false);
  });
});

describe("updateFaqSchema", () => {
  it("accepts a partial update with only isActive", () => {
    const result = updateFaqSchema.safeParse({ isActive: false });
    expect(result.success).toBe(true);
  });

  it("accepts an empty object", () => {
    const result = updateFaqSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("rejects an invalid sortOrder type", () => {
    const result = updateFaqSchema.safeParse({ sortOrder: "first" });
    expect(result.success).toBe(false);
  });
});
