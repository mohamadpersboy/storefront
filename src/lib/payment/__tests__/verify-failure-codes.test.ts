import { describe, expect, it } from "vitest";
import {
  UNCONFIRMED_VERIFY_FAILURE_CODES,
  isUnconfirmedVerifyFailureCode,
} from "@/lib/payment/verify-failure-codes";

describe("unconfirmed Zarinpal verify failure codes", () => {
  it("contains exactly -50, -51, -53 and -54", () => {
    expect([...UNCONFIRMED_VERIFY_FAILURE_CODES].sort((a, b) => a - b)).toEqual([-54, -53, -51, -50]);
  });

  it("matches only those codes (numbers)", () => {
    for (const c of [-50, -51, -53, -54]) expect(isUnconfirmedVerifyFailureCode(c)).toBe(true);
    for (const c of [0, 100, 101, -52, -55, -9, 500]) expect(isUnconfirmedVerifyFailureCode(c)).toBe(false);
  });
});
