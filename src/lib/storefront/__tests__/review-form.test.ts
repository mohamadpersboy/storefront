import { describe, expect, it } from "vitest";
import { buildReviewPayload, nextRatingForKey } from "../review-form";

const base = {
  productId: "p1",
  rating: 4,
  recommendation: "recommend",
  text: "خوب بود",
  images: [],
};

describe("buildReviewPayload", () => {
  it("builds a valid payload with only allowed fields", () => {
    const r = buildReviewPayload(base);
    expect(r.ok).toBe(true);
    if (r.ok)
      expect(Object.keys(r.payload).sort()).toEqual([
        "images",
        "productId",
        "rating",
        "recommendation",
        "text",
      ]);
  });

  it.each([null, 0, 6, 2.5, Number.NaN])("rejects rating %s", (rating) => {
    const r = buildReviewPayload({ ...base, rating });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.rating).toBeDefined();
  });

  it.each([1, 2, 3, 4, 5])("accepts rating %s", (rating) => {
    expect(buildReviewPayload({ ...base, rating }).ok).toBe(true);
  });

  it("validates recommendation", () => {
    expect(
      buildReviewPayload({ ...base, recommendation: "not_recommend" }).ok,
    ).toBe(true);
    expect(buildReviewPayload({ ...base, recommendation: null }).ok).toBe(
      false,
    );
    expect(buildReviewPayload({ ...base, recommendation: "x" }).ok).toBe(false);
  });

  it("rejects empty and whitespace text", () => {
    expect(buildReviewPayload({ ...base, text: "   " }).ok).toBe(false);
  });

  it("accepts text of 480 and rejects 481", () => {
    expect(buildReviewPayload({ ...base, text: "ا".repeat(480) }).ok).toBe(
      true,
    );
    const r = buildReviewPayload({ ...base, text: "ا".repeat(481) });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.text).toBeDefined();
  });

  it("trims text", () => {
    const r = buildReviewPayload({ ...base, text: "  سلام  " });
    if (r.ok) expect(r.payload.text).toBe("سلام");
  });

  it("handles 0, 1, 2 and 3 images", () => {
    const img = (n: number) => ({
      url: `https://x/${n}.jpg`,
      publicId: `id${n}`,
    });
    expect(buildReviewPayload({ ...base, images: [] }).ok).toBe(true);
    expect(buildReviewPayload({ ...base, images: [img(1)] }).ok).toBe(true);
    expect(buildReviewPayload({ ...base, images: [img(1), img(2)] }).ok).toBe(
      true,
    );
    const r = buildReviewPayload({ ...base, images: [img(1), img(2), img(3)] });
    expect(r.ok).toBe(false);
  });

  it("strips extra image fields", () => {
    const r = buildReviewPayload({
      ...base,
      images: [
        { url: "u", publicId: "p", width: 1 } as {
          url: string;
          publicId: string;
        },
      ],
    });
    if (r.ok) expect(r.payload.images[0]).toEqual({ url: "u", publicId: "p" });
  });

  it("reports all errors together", () => {
    const r = buildReviewPayload({
      ...base,
      rating: null,
      recommendation: null,
      text: "",
    });
    if (!r.ok)
      expect(Object.keys(r.errors).sort()).toEqual([
        "rating",
        "recommendation",
        "text",
      ]);
  });
});

describe("nextRatingForKey (RTL)", () => {
  it("ArrowLeft goes to next, ArrowRight to previous", () => {
    expect(nextRatingForKey(3, "ArrowLeft")).toBe(4);
    expect(nextRatingForKey(3, "ArrowRight")).toBe(2);
  });
  it("clamps at the ends", () => {
    expect(nextRatingForKey(5, "ArrowLeft")).toBe(5);
    expect(nextRatingForKey(1, "ArrowRight")).toBe(1);
  });
  it("starts at 1 when empty", () => {
    expect(nextRatingForKey(null, "ArrowLeft")).toBe(1);
  });
  it("supports Home/End and ignores other keys", () => {
    expect(nextRatingForKey(3, "Home")).toBe(1);
    expect(nextRatingForKey(3, "End")).toBe(5);
    expect(nextRatingForKey(3, "a")).toBeNull();
  });
});
