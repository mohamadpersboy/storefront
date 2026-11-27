import { describe, expect, it } from "vitest";
import {
  isDatabaseError,
  isIsrStrictActive,
  rethrowIfIsrStrictDbError,
} from "./isr-strict";

function named(name: string, message = "x"): Error {
  const e = new Error(message);
  e.name = name;
  return e;
}

const RUNTIME_STRICT = { ISR_STRICT: "1" };

describe("isIsrStrictActive", () => {
  it("is off without ISR_STRICT", () => {
    expect(isIsrStrictActive({})).toBe(false);
    expect(isIsrStrictActive({ ISR_STRICT: "0" })).toBe(false);
    expect(isIsrStrictActive({ ISR_STRICT: "true" })).toBe(false);
  });
  it("is on at runtime with ISR_STRICT=1", () => {
    expect(isIsrStrictActive(RUNTIME_STRICT)).toBe(true);
    expect(
      isIsrStrictActive({ ISR_STRICT: "1", NEXT_PHASE: "phase-production-server" }),
    ).toBe(true);
  });
  it("is off in the build phase even with ISR_STRICT=1", () => {
    expect(
      isIsrStrictActive({ ISR_STRICT: "1", NEXT_PHASE: "phase-production-build" }),
    ).toBe(false);
  });
});

describe("isDatabaseError", () => {
  it("detects driver and mongoose connection errors", () => {
    expect(isDatabaseError(named("MongooseServerSelectionError"))).toBe(true);
    expect(isDatabaseError(named("MongoServerSelectionError"))).toBe(true);
    expect(isDatabaseError(named("MongoNetworkError"))).toBe(true);
    expect(isDatabaseError(named("MongoServerError"))).toBe(true);
  });
  it("does not treat data errors or unknown values as DB errors", () => {
    expect(isDatabaseError(named("ValidationError"))).toBe(false);
    expect(isDatabaseError(named("CastError"))).toBe(false);
    expect(isDatabaseError(new TypeError("boom"))).toBe(false);
    expect(isDatabaseError("MongoNetworkError")).toBe(false);
    expect(isDatabaseError(null)).toBe(false);
  });
});

describe("rethrowIfIsrStrictDbError", () => {
  const dbError = named("MongooseServerSelectionError", "ECONNREFUSED");

  it("keeps old behavior (no throw) without ISR_STRICT", () => {
    expect(() => rethrowIfIsrStrictDbError(dbError, {})).not.toThrow();
  });
  it("rethrows a real DB error with ISR_STRICT=1 at runtime", () => {
    expect(() => rethrowIfIsrStrictDbError(dbError, RUNTIME_STRICT)).toThrow(dbError);
  });
  it("does not throw during build", () => {
    expect(() =>
      rethrowIfIsrStrictDbError(dbError, {
        ISR_STRICT: "1",
        NEXT_PHASE: "phase-production-build",
      }),
    ).not.toThrow();
  });
  it("does not throw for non-DB errors", () => {
    expect(() =>
      rethrowIfIsrStrictDbError(new TypeError("x"), RUNTIME_STRICT),
    ).not.toThrow();
  });
});
