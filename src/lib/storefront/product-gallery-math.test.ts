import { describe, expect, it } from "vitest";
import {
  clampProgress,
  progressToHeightCss,
  resolveGestureDirection,
  resolveReleaseProgress,
  resolveSlideIndex,
  scrollYToCollapsingProgress,
  verticalDeltaToProgress,
  GALLERY_MIN_HEIGHT_VH,
  GALLERY_MAX_HEIGHT_VH,
  VERTICAL_DRAG_RANGE_PX,
} from "@/lib/storefront/product-gallery-math";

describe("clampProgress", () => {
  it("clamps values below 0 to 0", () => {
    expect(clampProgress(-0.5)).toBe(0);
  });

  it("clamps values above 1 to 1", () => {
    expect(clampProgress(1.5)).toBe(1);
  });

  it("passes through in-range values unchanged", () => {
    expect(clampProgress(0.4)).toBe(0.4);
  });

  it("treats NaN as 0", () => {
    expect(clampProgress(Number.NaN)).toBe(0);
  });
});

describe("verticalDeltaToProgress", () => {
  it("dragging fully upward reaches progress 1", () => {
    expect(verticalDeltaToProgress(-VERTICAL_DRAG_RANGE_PX, 0)).toBe(1);
  });

  it("dragging downward from 0 stays clamped at 0", () => {
    expect(verticalDeltaToProgress(50, 0)).toBe(0);
  });

  it("partial upward drag is proportional", () => {
    expect(verticalDeltaToProgress(-VERTICAL_DRAG_RANGE_PX / 2, 0)).toBeCloseTo(0.5);
  });

  it("starts from an existing progress (e.g. already expanded)", () => {
    expect(verticalDeltaToProgress(0, 1)).toBe(1);
  });
});

describe("progressToHeightCss", () => {
  it("renders the minimum height at progress 0", () => {
    expect(progressToHeightCss(0)).toBe(`calc(${GALLERY_MIN_HEIGHT_VH}dvh + 0dvh)`);
  });

  it("renders the maximum height at progress 1", () => {
    expect(progressToHeightCss(1)).toBe(
      `calc(${GALLERY_MIN_HEIGHT_VH}dvh + ${GALLERY_MAX_HEIGHT_VH - GALLERY_MIN_HEIGHT_VH}dvh)`,
    );
  });

  it("clamps out-of-range progress before rendering", () => {
    expect(progressToHeightCss(2)).toBe(progressToHeightCss(1));
  });
});

describe("resolveReleaseProgress", () => {
  it("snaps to expanded (1) at or above the threshold", () => {
    expect(resolveReleaseProgress(0.5)).toBe(1);
    expect(resolveReleaseProgress(0.9)).toBe(1);
  });

  it("snaps back to normal (0) below the threshold", () => {
    expect(resolveReleaseProgress(0.49)).toBe(0);
    expect(resolveReleaseProgress(0)).toBe(0);
  });
});

describe("scrollYToCollapsingProgress", () => {
  it("no scroll keeps the starting progress", () => {
    expect(scrollYToCollapsingProgress(0, 1)).toBe(1);
  });

  it("scrolling the full collapse range reaches 0", () => {
    expect(scrollYToCollapsingProgress(120, 1)).toBe(0);
  });

  it("never re-expands on negative scroll", () => {
    expect(scrollYToCollapsingProgress(-50, 1)).toBe(1);
  });

  it("scales proportionally to the starting progress", () => {
    expect(scrollYToCollapsingProgress(60, 0.5)).toBeCloseTo(0.25);
  });
});

describe("resolveGestureDirection", () => {
  it("returns null before the movement threshold is reached", () => {
    expect(resolveGestureDirection(3, 3)).toBeNull();
  });

  it("detects horizontal when |dx| > |dy|", () => {
    expect(resolveGestureDirection(20, 5)).toBe("horizontal");
  });

  it("detects vertical when |dy| > |dx|", () => {
    expect(resolveGestureDirection(5, 20)).toBe("vertical");
  });
});

describe("resolveSlideIndex", () => {
  it("returns the same index for a single-image gallery", () => {
    expect(resolveSlideIndex(0, -200, 1)).toBe(0);
  });

  it("stays on the same slide below the swipe threshold", () => {
    expect(resolveSlideIndex(1, 10, 5)).toBe(1);
  });

  it("moves to the next slide on a leftward swipe (RTL convention)", () => {
    expect(resolveSlideIndex(0, -100, 3)).toBe(1);
  });

  it("moves to the previous slide on a rightward swipe", () => {
    expect(resolveSlideIndex(1, 100, 3)).toBe(0);
  });

  it("wraps around at the boundaries", () => {
    expect(resolveSlideIndex(0, 100, 3)).toBe(2);
    expect(resolveSlideIndex(2, -100, 3)).toBe(0);
  });
});
