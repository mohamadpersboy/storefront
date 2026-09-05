import { describe, expect, it } from "vitest";
import {
  createCheckSchema,
  returnCheckSchema,
  transferCheckSchema,
  checksListQuerySchema,
} from "./checks";

const validObjectId = "507f1f77bcf86cd799439011";
const validNationalId = "0499370899";

function validCheckPayload(overrides: Record<string, unknown> = {}) {
  return {
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
    ...overrides,
  };
}

describe("createCheckSchema", () => {
  it("accepts a valid payload", () => {
    const result = createCheckSchema.safeParse(validCheckPayload());
    expect(result.success).toBe(true);
  });

  it("defaults status to registered", () => {
    const result = createCheckSchema.safeParse(validCheckPayload());
    if (result.success) expect(result.data.status).toBe("registered");
  });

  it("rejects an invalid national ID for the issuer", () => {
    const result = createCheckSchema.safeParse(
      validCheckPayload({
        issuer: { firstName: "علی", lastName: "محمدی", nationalId: "1234567890" },
      }),
    );
    expect(result.success).toBe(false);
  });

  it("rejects a sayadiId that isn't 16 digits", () => {
    const result = createCheckSchema.safeParse(validCheckPayload({ sayadiId: "12345" }));
    expect(result.success).toBe(false);
  });

  it("rejects a checkSeries longer than 6 digits", () => {
    const result = createCheckSchema.safeParse(validCheckPayload({ checkSeries: "1234567" }));
    expect(result.success).toBe(false);
  });

  it("rejects a non-numeric checkNumber", () => {
    const result = createCheckSchema.safeParse(validCheckPayload({ checkNumber: "abc123" }));
    expect(result.success).toBe(false);
  });

  it("rejects an invalid phone number", () => {
    const result = createCheckSchema.safeParse(validCheckPayload({ phoneNumber: "123" }));
    expect(result.success).toBe(false);
  });

  it("rejects a zero or negative amount", () => {
    expect(createCheckSchema.safeParse(validCheckPayload({ amount: 0 })).success).toBe(false);
    expect(createCheckSchema.safeParse(validCheckPayload({ amount: -100 })).success).toBe(false);
  });

  it("rejects a non-integer amount", () => {
    const result = createCheckSchema.safeParse(validCheckPayload({ amount: 1000.5 }));
    expect(result.success).toBe(false);
  });

  it("rejects a due date earlier than the received date", () => {
    const result = createCheckSchema.safeParse(
      validCheckPayload({ receivedDate: "2024-02-01", dueDate: "2024-01-01" }),
    );
    expect(result.success).toBe(false);
  });

  it("accepts an optional guarantor with a valid national ID", () => {
    const result = createCheckSchema.safeParse(
      validCheckPayload({
        guarantor: { firstName: "رضا", lastName: "احمدی", nationalId: validNationalId },
      }),
    );
    expect(result.success).toBe(true);
  });

  it("rejects a guarantor with an invalid national ID", () => {
    const result = createCheckSchema.safeParse(
      validCheckPayload({
        guarantor: { firstName: "رضا", lastName: "احمدی", nationalId: "1111111111" },
      }),
    );
    expect(result.success).toBe(false);
  });

  it("works without a guarantor at all", () => {
    const result = createCheckSchema.safeParse(validCheckPayload({ guarantor: undefined }));
    expect(result.success).toBe(true);
  });
});

describe("returnCheckSchema", () => {
  it("accepts a valid return payload", () => {
    const result = returnCheckSchema.safeParse({
      returnedAt: "2024-03-01",
      returnedToName: "علی محمدی",
      reason: "درخواست مشتری",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a return payload without a reason", () => {
    const result = returnCheckSchema.safeParse({
      returnedAt: "2024-03-01",
      returnedToName: "علی محمدی",
      reason: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid returnedToNationalId when provided", () => {
    const result = returnCheckSchema.safeParse({
      returnedAt: "2024-03-01",
      returnedToName: "علی محمدی",
      returnedToNationalId: "1111111111",
      reason: "درخواست مشتری",
    });
    expect(result.success).toBe(false);
  });
});

describe("transferCheckSchema", () => {
  it("accepts a valid transfer payload without a national ID", () => {
    const result = transferCheckSchema.safeParse({ firstName: "سارا", lastName: "کریمی" });
    expect(result.success).toBe(true);
  });

  it("rejects a transfer payload missing the last name", () => {
    const result = transferCheckSchema.safeParse({ firstName: "سارا" });
    expect(result.success).toBe(false);
  });
});

describe("checksListQuerySchema", () => {
  it("applies defaults", () => {
    const result = checksListQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(10);
    }
  });

  it("rejects an invalid status filter", () => {
    const result = checksListQuerySchema.safeParse({ status: "not-a-status" });
    expect(result.success).toBe(false);
  });
});
