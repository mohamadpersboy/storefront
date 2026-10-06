import { afterEach, describe, expect, it, vi } from "vitest";
import { getOverlayRoot, OVERLAY_ROOT_ID } from "@/lib/storefront/overlay-root";

describe("getOverlayRoot", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("returns #sf-overlay-root when it exists (desktop frame)", () => {
    const root = { id: OVERLAY_ROOT_ID };
    const getElementById = vi.fn(() => root);
    vi.stubGlobal("document", { getElementById, body: { id: "body" } });
    expect(getOverlayRoot()).toBe(root);
    expect(getElementById).toHaveBeenCalledWith("sf-overlay-root");
  });

  it("falls back to document.body when there is no frame", () => {
    const body = { id: "body" };
    vi.stubGlobal("document", { getElementById: () => null, body });
    expect(getOverlayRoot()).toBe(body);
  });
});
