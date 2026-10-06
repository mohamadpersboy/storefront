import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { acquireScrollLock, getScrollLockCount, releaseScrollLock } from "@/lib/storefront/scroll-lock";

describe("scroll lock", () => {
  const doc = {
    body: { style: { overflow: "" } },
    documentElement: { style: { overflow: "" } },
    querySelector: (): unknown => null,
  };

  beforeEach(() => {
    doc.body.style.overflow = "auto";
    doc.documentElement.style.overflow = "scroll";
    vi.stubGlobal("document", doc);
  });
  afterEach(() => {
    while (getScrollLockCount() > 0) releaseScrollLock();
    vi.unstubAllGlobals();
  });

  it("locks and restores the previous overflow values", () => {
    acquireScrollLock();
    expect(doc.body.style.overflow).toBe("hidden");
    expect(doc.documentElement.style.overflow).toBe("hidden");
    releaseScrollLock();
    expect(doc.body.style.overflow).toBe("auto");
    expect(doc.documentElement.style.overflow).toBe("scroll");
  });

  it("stays locked until the last of several (nested) locks is released", () => {
    acquireScrollLock(); // Sheet
    acquireScrollLock(); // Lightbox
    releaseScrollLock();
    expect(doc.body.style.overflow).toBe("hidden");
    releaseScrollLock();
    expect(doc.body.style.overflow).toBe("auto");
    expect(getScrollLockCount()).toBe(0);
  });

  it("does not leak after many open/close cycles and ignores extra releases", () => {
    for (let i = 0; i < 20; i++) {
      acquireScrollLock();
      releaseScrollLock();
    }
    releaseScrollLock();
    expect(getScrollLockCount()).toBe(0);
    expect(doc.body.style.overflow).toBe("auto");
  });

  it("also locks the frame scroller on desktop and keeps its scrollTop", () => {
    const scroller = { style: { overflowY: "auto" }, scrollTop: 420, getClientRects: () => [{}] };
    doc.querySelector = () => scroller;
    acquireScrollLock();
    expect(scroller.style.overflowY).toBe("hidden");
    acquireScrollLock();
    releaseScrollLock();
    expect(scroller.style.overflowY).toBe("hidden");
    releaseScrollLock();
    expect(scroller.style.overflowY).toBe("auto");
    expect(scroller.scrollTop).toBe(420);
    doc.querySelector = () => null;
  });

  it("ignores a scroller without a box (display: contents on mobile)", () => {
    const scroller = { style: { overflowY: "" }, getClientRects: () => [] };
    doc.querySelector = () => scroller;
    acquireScrollLock();
    expect(scroller.style.overflowY).toBe("");
    releaseScrollLock();
    doc.querySelector = () => null;
  });
});
