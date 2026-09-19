import { describe, expect, it } from "vitest";
import {
  getTouchDistance,
  isPinchZoomGesture,
  shouldResetFocusOnScroll,
  PINCH_ZOOM_IN_SCALE_THRESHOLD,
  SCROLL_RESET_THRESHOLD_PX,
} from "@/lib/storefront/product-gallery-math";

describe("getTouchDistance", () => {
  it("returns 0 for identical points", () => {
    expect(getTouchDistance(10, 10, 10, 10)).toBe(0);
  });

  it("computes straight horizontal distance", () => {
    expect(getTouchDistance(0, 0, 100, 0)).toBe(100);
  });

  it("computes straight vertical distance", () => {
    expect(getTouchDistance(0, 0, 0, 50)).toBe(50);
  });

  it("computes diagonal (Euclidean) distance", () => {
    expect(getTouchDistance(0, 0, 3, 4)).toBe(5);
  });
});

describe("isPinchZoomGesture", () => {
  it("is false when the start distance is zero or invalid", () => {
    expect(isPinchZoomGesture(0, 100)).toBe(false);
    expect(isPinchZoomGesture(-10, 100)).toBe(false);
  });

  it("is false when fingers stay close to the starting distance", () => {
    expect(isPinchZoomGesture(100, 105)).toBe(false);
  });

  it("is true right at the threshold scale factor", () => {
    expect(isPinchZoomGesture(100, 100 * PINCH_ZOOM_IN_SCALE_THRESHOLD)).toBe(true);
  });

  it("is true when fingers move apart well beyond the threshold", () => {
    expect(isPinchZoomGesture(100, 250)).toBe(true);
  });

  it("is false when fingers move closer together (zoom out / pinch in)", () => {
    expect(isPinchZoomGesture(200, 100)).toBe(false);
  });
});

describe("shouldResetFocusOnScroll", () => {
  it("is false when the page has not scrolled", () => {
    expect(shouldResetFocusOnScroll(500, 500)).toBe(false);
  });

  it("is false when the page scrolled upward", () => {
    expect(shouldResetFocusOnScroll(500, 400)).toBe(false);
  });

  it("is false below the reset threshold", () => {
    expect(shouldResetFocusOnScroll(500, 500 + SCROLL_RESET_THRESHOLD_PX - 1)).toBe(false);
  });

  it("is true right at the reset threshold", () => {
    expect(shouldResetFocusOnScroll(500, 500 + SCROLL_RESET_THRESHOLD_PX)).toBe(true);
  });

  it("is true for a large downward scroll", () => {
    expect(shouldResetFocusOnScroll(500, 900)).toBe(true);
  });
});
