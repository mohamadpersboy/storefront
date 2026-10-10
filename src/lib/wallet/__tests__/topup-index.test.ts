import { describe, expect, it } from "vitest";
import { WalletTransaction } from "@/models/WalletTransaction";

describe("WalletTransaction unique index (schema definition only)", () => {
  it("16: defines a partial unique index on idempotencyKey (real DB enforcement NOT VERIFIED)", () => {
    const idx = WalletTransaction.schema.indexes().find(([f]) => "idempotencyKey" in f);
    expect(idx).toBeDefined();
    expect(idx![1]).toMatchObject({
      unique: true,
      partialFilterExpression: { idempotencyKey: { $type: "string" } },
    });
  });
});
