import { describe, expect, it } from "vitest";
import { updateReferralSettingsSchema } from "./referral-settings";

const validPayload = {
  enabled: true,
  maxReferralsPerUser: 10,
  rewardDiscountPercentage: 15,
  rewardMaxDiscountAmount: 200000,
  minInviteeOrderAmount: 100000,
  rewardCouponValidityDays: 30,
};

describe("updateReferralSettingsSchema", () => {
  it("accepts a fully valid payload", () => {
    expect(updateReferralSettingsSchema.safeParse(validPayload).success).toBe(true);
  });

  it("accepts null maxReferralsPerUser (unlimited)", () => {
    const result = updateReferralSettingsSchema.safeParse({
      ...validPayload,
      maxReferralsPerUser: null,
    });
    expect(result.success).toBe(true);
  });

  it("accepts null rewardMaxDiscountAmount (no cap)", () => {
    const result = updateReferralSettingsSchema.safeParse({
      ...validPayload,
      rewardMaxDiscountAmount: null,
    });
    expect(result.success).toBe(true);
  });

  it("rejects a zero maxReferralsPerUser (must be at least 1, use null for unlimited)", () => {
    const result = updateReferralSettingsSchema.safeParse({
      ...validPayload,
      maxReferralsPerUser: 0,
    });
    expect(result.success).toBe(false);
  });

  it("rejects a discount percentage above 100", () => {
    const result = updateReferralSettingsSchema.safeParse({
      ...validPayload,
      rewardDiscountPercentage: 150,
    });
    expect(result.success).toBe(false);
  });

  it("rejects a negative discount percentage", () => {
    const result = updateReferralSettingsSchema.safeParse({
      ...validPayload,
      rewardDiscountPercentage: -5,
    });
    expect(result.success).toBe(false);
  });

  it("rejects a negative minInviteeOrderAmount", () => {
    const result = updateReferralSettingsSchema.safeParse({
      ...validPayload,
      minInviteeOrderAmount: -1,
    });
    expect(result.success).toBe(false);
  });

  it("rejects a zero rewardCouponValidityDays", () => {
    const result = updateReferralSettingsSchema.safeParse({
      ...validPayload,
      rewardCouponValidityDays: 0,
    });
    expect(result.success).toBe(false);
  });

  it("rejects a missing enabled field", () => {
    const rest: Record<string, unknown> = { ...validPayload };
    delete rest.enabled;
    const result = updateReferralSettingsSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });
});
