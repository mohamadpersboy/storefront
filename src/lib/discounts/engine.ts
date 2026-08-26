import type { PaymentMethod } from "@/models/Order";

/**
 * Every discount that touches an Order's final price is computed here
 * and nowhere else (§42 — a single, testable calculation engine
 * instead of the same math repeated across routes/components).
 */

export function computeCouponDiscount(
  eligibleAmount: number,
  discountPercentage: number,
  maxDiscountAmount: number | null,
): number {
  const raw = Math.round((eligibleAmount * discountPercentage) / 100);
  return maxDiscountAmount !== null ? Math.min(raw, maxDiscountAmount) : raw;
}

export interface PaymentRewardSettings {
  onlinePaymentRewardEnabled: boolean;
  onlinePaymentRewardPercentage: number;
  mixedPaymentRewardEnabled: boolean;
  mixedPaymentRewardPercentage: number;
}

export interface PaymentRewardResult {
  amount: number;
  percentage: number;
  rewardType: "online" | "mixed";
}

export function computePaymentReward(
  paymentMethod: PaymentMethod,
  eligibleAmount: number,
  settings: PaymentRewardSettings,
): PaymentRewardResult | null {
  if (paymentMethod === "online" && settings.onlinePaymentRewardEnabled) {
    return {
      amount: Math.round((eligibleAmount * settings.onlinePaymentRewardPercentage) / 100),
      percentage: settings.onlinePaymentRewardPercentage,
      rewardType: "online",
    };
  }
  if (paymentMethod === "split" && settings.mixedPaymentRewardEnabled) {
    return {
      amount: Math.round((eligibleAmount * settings.mixedPaymentRewardPercentage) / 100),
      percentage: settings.mixedPaymentRewardPercentage,
      rewardType: "mixed",
    };
  }
  return null;
}

export interface AppliedCouponInput {
  id: string;
  code: string;
  discountPercentage: number;
  maxDiscountAmount: number | null;
}

export interface ResolvedOrderDiscount {
  source: "coupon" | "payment_reward" | null;
  amount: number;
  couponId?: string;
  couponCode?: string;
  discountPercentage?: number;
  rewardType?: "online" | "mixed";
}

/**
 * §41 decision (confirmed with the project owner): Coupon and the
 * automatic Payment Reward are mutually exclusive on a single order —
 * whichever is "applied" wins and the other never runs. A manually
 * entered Coupon is always treated as "applied first" here, since
 * it's a deliberate action, while the Payment Reward is a passive,
 * automatic side effect of the chosen payment method. That's why an
 * `appliedCoupon` short-circuits the reward check entirely below,
 * instead of the two being evaluated independently.
 */
export function resolveOrderDiscount(params: {
  eligibleAmount: number;
  paymentMethod: PaymentMethod;
  appliedCoupon?: AppliedCouponInput | null;
  rewardSettings: PaymentRewardSettings;
}): ResolvedOrderDiscount {
  if (params.appliedCoupon) {
    const amount = computeCouponDiscount(
      params.eligibleAmount,
      params.appliedCoupon.discountPercentage,
      params.appliedCoupon.maxDiscountAmount,
    );
    return {
      source: "coupon",
      amount,
      couponId: params.appliedCoupon.id,
      couponCode: params.appliedCoupon.code,
      discountPercentage: params.appliedCoupon.discountPercentage,
    };
  }

  const reward = computePaymentReward(
    params.paymentMethod,
    params.eligibleAmount,
    params.rewardSettings,
  );
  if (reward) {
    return {
      source: "payment_reward",
      amount: reward.amount,
      rewardType: reward.rewardType,
      discountPercentage: reward.percentage,
    };
  }

  return { source: null, amount: 0 };
}
