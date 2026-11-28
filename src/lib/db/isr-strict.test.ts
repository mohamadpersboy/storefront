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

// Regression: خطاهای واقعی Mongoose (نه نام ساختگی) از مسیر Helper.
describe("real mongoose errors through rethrowIfIsrStrictDbError", () => {
  it("rethrows a REAL MongooseServerSelectionError in strict runtime", async () => {
    const mongoose = (await import("mongoose")).default;
    const conn = mongoose.createConnection();
    let real: unknown;
    try {
      await conn.openUri("mongodb://127.0.0.1:1/isr_test", {
        serverSelectionTimeoutMS: 700,
        bufferCommands: false,
      });
    } catch (e) {
      real = e;
    } finally {
      await conn.close().catch(() => {});
    }
    expect((real as Error).name).toBe("MongooseServerSelectionError");
    expect(isDatabaseError(real)).toBe(true);
    expect(() => rethrowIfIsrStrictDbError(real, RUNTIME_STRICT)).toThrow(
      real as Error,
    );
    expect(() => rethrowIfIsrStrictDbError(real, {})).not.toThrow();
    expect(() =>
      rethrowIfIsrStrictDbError(real, {
        ISR_STRICT: "1",
        NEXT_PHASE: "phase-production-build",
      }),
    ).not.toThrow();
  });

  it("does not treat REAL ValidationError / CastError as DB errors", async () => {
    const mongoose = (await import("mongoose")).default;
    const schema = new mongoose.Schema({ n: { type: Number, required: true } });
    const Model = mongoose.model("IsrStrictRegression", schema);
    let validation: unknown;
    try {
      await new Model({}).validate();
    } catch (e) {
      validation = e;
    }
    let cast: unknown;
    try {
      schema.path("n").cast("abc");
    } catch (e) {
      cast = e;
    }
    expect((validation as Error).name).toBe("ValidationError");
    expect((cast as Error).name).toBe("CastError");
    for (const err of [validation, cast]) {
      expect(isDatabaseError(err)).toBe(false);
      expect(() => rethrowIfIsrStrictDbError(err, RUNTIME_STRICT)).not.toThrow();
    }
  });

  it("detects SRV DNS failure (plain Error with code ENOTFOUND)", () => {
    const e = Object.assign(new Error("querySrv ENOTFOUND x"), {
      code: "ENOTFOUND",
    });
    expect(isDatabaseError(e)).toBe(true);
  });

  it("walks cause and AggregateError", () => {
    const db = named("MongoNetworkError");
    expect(isDatabaseError(new Error("wrap", { cause: db }))).toBe(true);
    expect(isDatabaseError(new AggregateError([new Error("a"), db]))).toBe(true);
    const cast = named("CastError");
    expect(isDatabaseError(new Error("wrap", { cause: cast }))).toBe(false);
    expect(isDatabaseError(named("CastError"))).toBe(false);
    const withDbCause = Object.assign(named("ValidationError"), { cause: db });
    expect(isDatabaseError(withDbCause)).toBe(false);
  });

  it("ignores plain errors, non-errors and empty results", () => {
    expect(isDatabaseError(new Error("boom"))).toBe(false);
    expect(isDatabaseError(null)).toBe(false);
    expect(isDatabaseError("MongoError")).toBe(false);
    expect(isDatabaseError(undefined)).toBe(false);
  });
});
