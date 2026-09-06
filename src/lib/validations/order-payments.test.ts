import { describe, expect, it } from "vitest";
import { recordOrderPaymentSchema } from "./order-payments";

const validObjectId = "507f1f77bcf86cd799439011";
const validNationalId = "0499370899";

describe("recordOrderPaymentSchema", () => {
  it("accepts a valid cash payment", () => {
    const result = recordOrderPaymentSchema.safeParse({ method: "cash", amount: 100_000 });
    expect(result.success).toBe(true);
  });

  it("rejects a non-positive cash amount", () => {
    const result = recordOrderPaymentSchema.safeParse({ method: "cash", amount: 0 });
    expect(result.success).toBe(false);
  });

  it("accepts a valid pos payment", () => {
    const result = recordOrderPaymentSchema.safeParse({
      method: "pos",
      amount: 100_000,
      posTerminalId: validObjectId,
    });
    expect(result.success).toBe(true);
  });

  it("rejects a pos payment without a terminal id", () => {
    const result = recordOrderPaymentSchema.safeParse({ method: "pos", amount: 100_000 });
    expect(result.success).toBe(false);
  });

  it("accepts a valid card_transfer payment", () => {
    const result = recordOrderPaymentSchema.safeParse({
      method: "card_transfer",
      amount: 100_000,
      cardAccountId: validObjectId,
    });
    expect(result.success).toBe(true);
  });

  it("accepts a check payment referencing an existing check", () => {
    const result = recordOrderPaymentSchema.safeParse({
      method: "check",
      checkId: validObjectId,
    });
    expect(result.success).toBe(true);
  });

  it("accepts a check payment with a new check payload", () => {
    const result = recordOrderPaymentSchema.safeParse({
      method: "check",
      newCheck: {
        bankId: validObjectId,
        issuer: { firstName: "علی", lastName: "محمدی", nationalId: validNationalId },
        receiverId: validObjectId,
        phoneNumber: "09121234567",
        receivedDate: "2024-01-01",
        dueDate: "2024-02-01",
        amount: 5_000_000,
        checkSeries: "12345",
        checkNumber: "654321",
        sayadiId: "1234567890123456",
      },
    });
    expect(result.success).toBe(true);
  });

  it("rejects a check payment with neither checkId nor newCheck", () => {
    const result = recordOrderPaymentSchema.safeParse({ method: "check" });
    expect(result.success).toBe(false);
  });

  it("rejects a check payment with both checkId and newCheck", () => {
    const result = recordOrderPaymentSchema.safeParse({
      method: "check",
      checkId: validObjectId,
      newCheck: {
        bankId: validObjectId,
        issuer: { firstName: "علی", lastName: "محمدی", nationalId: validNationalId },
        receiverId: validObjectId,
        phoneNumber: "09121234567",
        receivedDate: "2024-01-01",
        dueDate: "2024-02-01",
        amount: 5_000_000,
        checkSeries: "12345",
        checkNumber: "654321",
        sayadiId: "1234567890123456",
      },
    });
    expect(result.success).toBe(false);
  });

  it("rejects an unknown method", () => {
    const result = recordOrderPaymentSchema.safeParse({ method: "wire", amount: 100_000 });
    expect(result.success).toBe(false);
  });
});
