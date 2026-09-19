import { describe, expect, it } from "vitest";
import {
  getTouchDistance,
  shouldResetFocusOnScroll,
  clampZoomScale,
  getMaxPanOffsetPx,
  clampPanOffsetPx,
  getFocusedSlideWidthPx,
  getSlideOffsetLeftPx,
  getTrackContentWidthPx,
  shouldAlignSlideToRightEdge,
  getEdgeAlignedScrollLeft,
  clampScrollLeft,
  SCROLL_RESET_THRESHOLD_PX,
  ZOOM_MIN_SCALE,
  ZOOM_MAX_SCALE,
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

describe("clampZoomScale", () => {
  it("clamps below the minimum to the minimum", () => {
    expect(clampZoomScale(0.5)).toBe(ZOOM_MIN_SCALE);
  });

  it("clamps above the maximum to the maximum", () => {
    expect(clampZoomScale(10)).toBe(ZOOM_MAX_SCALE);
  });

  it("passes through in-range values unchanged", () => {
    expect(clampZoomScale(2)).toBe(2);
  });

  it("treats NaN as the minimum", () => {
    expect(clampZoomScale(Number.NaN)).toBe(ZOOM_MIN_SCALE);
  });
});

describe("getMaxPanOffsetPx", () => {
  it("is 0 at the minimum scale (nothing to pan)", () => {
    expect(getMaxPanOffsetPx(300, ZOOM_MIN_SCALE)).toBe(0);
  });

  it("is 0 below the minimum scale", () => {
    expect(getMaxPanOffsetPx(300, 0.5)).toBe(0);
  });

  it("grows with scale", () => {
    const at1_5 = getMaxPanOffsetPx(300, 1.5);
    const at2 = getMaxPanOffsetPx(300, 2);
    expect(at2).toBeGreaterThan(at1_5);
    expect(at1_5).toBeGreaterThan(0);
  });

  it("matches the known formula at scale 2", () => {
    // containerSize * (scale-1) / (2*scale) = 300 * 1 / 4 = 75
    expect(getMaxPanOffsetPx(300, 2)).toBeCloseTo(75);
  });

  it("scales proportionally with container size", () => {
    expect(getMaxPanOffsetPx(600, 2)).toBeCloseTo(150);
  });
});

describe("clampPanOffsetPx", () => {
  it("clamps to 0 at the minimum scale regardless of offset", () => {
    expect(clampPanOffsetPx(999, 300, ZOOM_MIN_SCALE)).toBe(0);
  });

  it("passes through an offset within bounds", () => {
    expect(clampPanOffsetPx(10, 300, 2)).toBe(10);
  });

  it("clamps a too-large positive offset to the max", () => {
    expect(clampPanOffsetPx(500, 300, 2)).toBeCloseTo(75);
  });

  it("clamps a too-large negative offset to the negative max", () => {
    expect(clampPanOffsetPx(-500, 300, 2)).toBeCloseTo(-75);
  });
});

describe("getFocusedSlideWidthPx", () => {
  it("uses 80% of viewport width when that is the smaller bound", () => {
    // containerWidth*0.9 = 900, viewportWidth*0.8 = 320 → min is 320
    expect(getFocusedSlideWidthPx(1000, 400)).toBeCloseTo(320);
  });

  it("uses 90% of container width when that is the smaller bound (desktop-capped)", () => {
    // containerWidth*0.9 = 360, viewportWidth*0.8 = 1152 → min is 360
    expect(getFocusedSlideWidthPx(400, 1440)).toBeCloseTo(360);
  });
});

describe("getSlideOffsetLeftPx", () => {
  it("is 0 for the first slide", () => {
    expect(getSlideOffsetLeftPx(0, 300, 12)).toBe(0);
  });

  it("accumulates width + gap for each preceding slide", () => {
    expect(getSlideOffsetLeftPx(2, 300, 12)).toBe(2 * (300 + 12));
  });
});

describe("getTrackContentWidthPx", () => {
  it("is 0 for an empty gallery", () => {
    expect(getTrackContentWidthPx(0, 300, 12)).toBe(0);
  });

  it("has no gap for a single slide", () => {
    expect(getTrackContentWidthPx(1, 300, 12)).toBe(300);
  });

  it("sums widths plus gaps between slides", () => {
    expect(getTrackContentWidthPx(3, 300, 12)).toBe(3 * 300 + 2 * 12);
  });
});

describe("shouldAlignSlideToRightEdge", () => {
  it("aligns right when the slide overflows only on the right", () => {
    expect(shouldAlignSlideToRightEdge(50, 450, 0, 400)).toBe(true);
  });

  it("aligns left when the slide overflows only on the left", () => {
    expect(shouldAlignSlideToRightEdge(-50, 350, 0, 400)).toBe(false);
  });

  it("falls back to nearest edge by center when fully visible and left-of-center", () => {
    expect(shouldAlignSlideToRightEdge(0, 100, 0, 400)).toBe(false);
  });

  it("falls back to nearest edge by center when fully visible and right-of-center", () => {
    expect(shouldAlignSlideToRightEdge(300, 400, 0, 400)).toBe(true);
  });
});

describe("getEdgeAlignedScrollLeft", () => {
  it("targets the slide's own offset when aligning to the left edge", () => {
    expect(getEdgeAlignedScrollLeft(240, 320, 360, false)).toBe(240);
  });

  it("targets offset + width - container when aligning to the right edge", () => {
    expect(getEdgeAlignedScrollLeft(240, 320, 360, true)).toBe(240 + 320 - 360);
  });
});

describe("clampScrollLeft", () => {
  it("passes through an in-range value", () => {
    expect(clampScrollLeft(100, 500)).toBe(100);
  });

  it("clamps a negative value up to 0", () => {
    expect(clampScrollLeft(-50, 500)).toBe(0);
  });

  it("clamps a too-large value down to the max", () => {
    expect(clampScrollLeft(999, 500)).toBe(500);
  });

  it("treats a negative max as 0 (nothing to scroll)", () => {
    expect(clampScrollLeft(50, -20)).toBe(0);
  });
});
