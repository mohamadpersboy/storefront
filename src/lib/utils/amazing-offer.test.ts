import { describe, it, expect } from "vitest";
import {
  getAmazingOfferStatus,
  isAmazingOfferLive,
  computeAmazingOfferPrice,
} from "@/lib/utils/amazing-offer";

const hour = 60 * 60 * 1000;

describe("getAmazingOfferStatus", () => {
  it("is 'paused' whenever isActive is false, regardless of the schedule", () => {
    const now = Date.now();
    expect(
      getAmazingOfferStatus({
        isActive: false,
        startAt: new Date(now - hour),
        endAt: new Date(now + hour),
      }),
    ).toBe("paused");
  });

  it("is 'scheduled' before startAt", () => {
    const now = Date.now();
    expect(
      getAmazingOfferStatus({
        isActive: true,
        startAt: new Date(now + hour),
        endAt: new Date(now + 2 * hour),
      }),
    ).toBe("scheduled");
  });

  it("is 'active' between startAt and endAt", () => {
    const now = Date.now();
    expect(
      getAmazingOfferStatus({
        isActive: true,
        startAt: new Date(now - hour),
        endAt: new Date(now + hour),
      }),
    ).toBe("active");
  });

  it("is 'expired' after endAt", () => {
    const now = Date.now();
    expect(
      getAmazingOfferStatus({
        isActive: true,
        startAt: new Date(now - 2 * hour),
        endAt: new Date(now - hour),
      }),
    ).toBe("expired");
  });
});

describe("isAmazingOfferLive", () => {
  it("returns true only for the 'active' computed status", () => {
    const now = Date.now();
    expect(
      isAmazingOfferLive({
        isActive: true,
        startAt: new Date(now - hour),
        endAt: new Date(now + hour),
      }),
    ).toBe(true);
    expect(
      isAmazingOfferLive({
        isActive: false,
        startAt: new Date(now - hour),
        endAt: new Date(now + hour),
      }),
    ).toBe(false);
  });
});

describe("computeAmazingOfferPrice", () => {
  it("applies a percent discount", () => {
    expect(computeAmazingOfferPrice(100_000, "percent", 30)).toBe(70_000);
  });

  it("applies a fixed discount", () => {
    expect(computeAmazingOfferPrice(100_000, "fixed", 25_000)).toBe(75_000);
  });

  it("never returns a negative price", () => {
    expect(computeAmazingOfferPrice(10_000, "fixed", 50_000)).toBe(0);
  });
});
