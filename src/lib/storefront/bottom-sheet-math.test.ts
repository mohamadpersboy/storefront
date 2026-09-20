import { describe, expect, it } from "vitest";
import {
  clampDragOffsetPx,
  shouldDismissBottomSheet,
  DISMISS_DRAG_MIN_PX,
} from "./bottom-sheet-math";

describe("clampDragOffsetPx", () => {
  it("passes through a positive (downward) offset unchanged", () => {
    expect(clampDragOffsetPx(120)).toBe(120);
  });

  it("clamps a negative (upward) offset to 0", () => {
    expect(clampDragOffsetPx(-50)).toBe(0);
  });

  it("is 0 for exactly 0", () => {
    expect(clampDragOffsetPx(0)).toBe(0);
  });
});

describe("shouldDismissBottomSheet", () => {
  it("does not dismiss for a tiny drag on a tall sheet", () => {
    expect(shouldDismissBottomSheet(10, 600)).toBe(false);
  });

  it("dismisses once 30% of a tall sheet's height is dragged", () => {
    expect(shouldDismissBottomSheet(600 * 0.3, 600)).toBe(true);
  });

  it("does not dismiss just under the 30% ratio", () => {
    expect(shouldDismissBottomSheet(600 * 0.3 - 1, 600)).toBe(false);
  });

  it("uses the absolute minimum for a short sheet where 30% is tiny", () => {
    // 30% of 100 = 30px, but the absolute floor (80px) should win
    expect(shouldDismissBottomSheet(50, 100)).toBe(false);
    expect(shouldDismissBottomSheet(DISMISS_DRAG_MIN_PX, 100)).toBe(true);
  });

  it("dismisses for a very large drag regardless of sheet height", () => {
    expect(shouldDismissBottomSheet(1000, 400)).toBe(true);
  });
});
