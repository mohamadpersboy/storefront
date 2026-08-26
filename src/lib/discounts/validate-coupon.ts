import { formatToman } from "@/lib/utils/format";

export interface CouponEligibilityInput {
  code: string;
  status: "active" | "inactive";
  type: "public" | "private";
  minOrderAmount: number;
  startsAt: Date | null;
  expiresAt: Date;
  usageLimit: number | null;
  usedCount: number;
  perUserLimit: number | null;
  allowedUserIds: string[]; // only meaningful when type === "private"
}

export type CouponValidationResult =
  | { valid: true }
  | { valid: false; reason: string };

/**
 * Pure — takes an already-fetched coupon (plus an already-counted
 * per-user redemption count) and decides eligibility with no I/O.
 * Deliberately separated from the DB-fetching caller so every rule in
 * §27 can be unit tested directly (see validate-coupon.test.ts)
 * without spinning up MongoDB.
 */
export function validateCouponEligibility(params: {
  coupon: CouponEligibilityInput;
  userId: string;
  eligibleAmount: number;
  usedByUserCount: number;
  now?: Date;
}): CouponValidationResult {
  const { coupon, userId, eligibleAmount, usedByUserCount } = params;
  const now = params.now ?? new Date();

  if (coupon.status !== "active") {
    return { valid: false, reason: "این کد تخفیف غیرفعال است" };
  }
  if (coupon.startsAt && now < coupon.startsAt) {
    return { valid: false, reason: "این کد تخفیف هنوز فعال نشده است" };
  }
  if (now > coupon.expiresAt) {
    return { valid: false, reason: "این کد تخفیف منقضی شده است" };
  }
  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
    return { valid: false, reason: "ظرفیت استفاده از این کد تخفیف تمام شده است" };
  }
  if (eligibleAmount < coupon.minOrderAmount) {
    return {
      valid: false,
      reason: `حداقل مبلغ سفارش برای این کد تخفیف ${formatToman(coupon.minOrderAmount)} است`,
    };
  }
  if (coupon.type === "private" && !coupon.allowedUserIds.includes(userId)) {
    return { valid: false, reason: "این کد تخفیف برای شما قابل استفاده نیست" };
  }
  if (coupon.perUserLimit !== null && usedByUserCount >= coupon.perUserLimit) {
    return { valid: false, reason: "شما قبلاً از این کد تخفیف استفاده کرده‌اید" };
  }

  return { valid: true };
}
