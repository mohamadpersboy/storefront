/** سازنده‌های کلید یکتا برای اعلان‌های خودکار (Idempotency). */
export const dedupeKeys = {
  orderCreated: (orderId: string) => `order-created:${orderId}`,
  orderStatus: (orderId: string, status: string) => `order-status:${orderId}:${status}`,
  paymentSuccess: (paymentId: string) => `payment-success:${paymentId}`,
  paymentFailed: (paymentId: string) => `payment-failed:${paymentId}`,
  couponPublic: (couponId: string) => `coupon-public:${couponId}`,
  couponPersonal: (couponId: string, userId: string) => `coupon-personal:${couponId}:${userId}`,
  couponExpiry: (couponId: string, userId: string, hours: number) =>
    `coupon-expiry:${couponId}:${userId}:${hours}h`,
  referralSignup: (referralId: string) => `referral-signup:${referralId}`,
  referralFirstPurchase: (referralId: string) => `referral-first-purchase:${referralId}`,
  referralReward: (referralId: string) => `referral-reward:${referralId}`,
  dailySpecialOffer: (dateKey: string) => `daily-special-offer:${dateKey}`,
} as const;

export const DAILY_SPECIAL_OFFER_KEY_PREFIX = "daily-special-offer:";
