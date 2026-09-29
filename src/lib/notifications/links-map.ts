/** مقصد لینک اعلان‌های خودکار (مسیرهای واقعی Storefront). */
export const NOTIFICATION_LINKS = {
  /** بخش «شگفت‌انگیز» در صفحه اصلی (مسیر جداگانه‌ای وجود ندارد). */
  specialOffers: "/",
  coupons: "/account/coupons",
  referral: "/account/referral",
  order: (orderId: string) => `/orders/${orderId}`,
} as const;
