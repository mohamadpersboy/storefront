import { describe, expect, it } from "vitest";
import {
  mapReviewDeleteError,
  mapReviewImageUploadError,
  mapReviewSubmitError,
  REVIEW_BUYERS_ONLY_MESSAGE,
  REVIEW_UNAVAILABLE_MESSAGE,
} from "../review-form-messages";

describe("mapReviewSubmitError", () => {
  it("maps known statuses", () => {
    expect(mapReviewSubmitError(401).refresh).toBe(true);
    expect(mapReviewSubmitError(403).message).toBe(REVIEW_BUYERS_ONLY_MESSAGE);
    expect(mapReviewSubmitError(404).message).toBe(REVIEW_UNAVAILABLE_MESSAGE);
    expect(mapReviewSubmitError(409).refresh).toBe(true);
    expect(mapReviewSubmitError(422).refresh).toBe(false);
  });
  it("falls back for 500 and unknown", () => {
    const a = mapReviewSubmitError(500);
    expect(a.refresh).toBe(false);
    expect(mapReviewSubmitError(0)).toEqual(a);
  });
  it("gives distinct messages for 401/403/404/409/422/500", () => {
    const set = new Set(
      [401, 403, 404, 409, 422, 500].map(
        (s) => mapReviewSubmitError(s).message,
      ),
    );
    expect(set.size).toBe(6);
  });
});

describe("mapReviewDeleteError", () => {
  it("refreshes on 404 and 401", () => {
    expect(mapReviewDeleteError(404).refresh).toBe(true);
    expect(mapReviewDeleteError(401).refresh).toBe(true);
    expect(mapReviewDeleteError(500).refresh).toBe(false);
  });
});

describe("mapReviewImageUploadError", () => {
  it("maps 401/403 and fallback", () => {
    expect(mapReviewImageUploadError(401)).not.toBe(
      mapReviewImageUploadError(null),
    );
    expect(mapReviewImageUploadError(403)).not.toBe(
      mapReviewImageUploadError(500),
    );
    expect(mapReviewImageUploadError(null)).toBe(
      mapReviewImageUploadError(500),
    );
  });
});
