import type { Types } from "mongoose";
import type { OrderStatus } from "@/lib/constants/order-status";
import { dedupeKeys } from "./dedupe";
import { NOTIFICATION_LINKS } from "./links-map";
import { safeCreateNotification, safeCreateNotifications, type NewNotification } from "./service";
import {
  couponExpiryReminderText,
  orderCreatedText,
  orderStatusText,
  paymentFailedText,
  paymentSuccessText,
  personalCouponText,
  publicCouponText,
  referralFirstPurchaseText,
  referralRewardText,
  referralSignupText,
  type CouponSnapshot,
} from "./templates";

/**
 * توابع سطح‌دامنه: Serviceهای Order/Payment/Coupon/Referral فقط این
 * توابع را صدا می‌زنند. همه Best-effort هستند (شکست اعلان، عملیات
 * اصلی را Fail یا Rollback نمی‌کند) و بعد از موفقیت عملیات اصلی صدا
 * زده می‌شوند. Event Bus جدیدی وجود ندارد.
 */
type Id = string | Types.ObjectId;

export async function notifyOrderCreated(p: {
  orderId: Id;
  orderNumber: number;
  customerId: Id;
}): Promise<void> {
  const orderId = String(p.orderId);
  await safeCreateNotification({
    audience: "user",
    userId: p.customerId,
    type: "order",
    ...orderCreatedText(p.orderNumber),
    link: NOTIFICATION_LINKS.order(orderId),
    ref: { kind: "order", id: orderId },
    dedupeKey: dedupeKeys.orderCreated(orderId),
  });
}

export async function notifyOrderStatusChanged(p: {
  orderId: Id;
  orderNumber: number;
  customerId: Id;
  status: OrderStatus;
}): Promise<void> {
  const text = orderStatusText(p.status, p.orderNumber);
  if (!text) return;
  const orderId = String(p.orderId);
  await safeCreateNotification({
    audience: "user",
    userId: p.customerId,
    type: "order",
    ...text,
    link: NOTIFICATION_LINKS.order(orderId),
    ref: { kind: "order", id: orderId },
    // وضعیت‌های سفارش فقط رو به جلو می‌روند؛ (سفارش، وضعیت) یکتاست.
    dedupeKey: dedupeKeys.orderStatus(orderId, p.status),
  });
}

export async function notifyPaymentResult(p: {
  paymentId: Id;
  orderId: Id;
  orderNumber: number;
  customerId: Id;
  success: boolean;
}): Promise<void> {
  const orderId = String(p.orderId);
  const paymentId = String(p.paymentId);
  await safeCreateNotification({
    audience: "user",
    userId: p.customerId,
    type: "order",
    ...(p.success ? paymentSuccessText(p.orderNumber) : paymentFailedText(p.orderNumber)),
    link: NOTIFICATION_LINKS.order(orderId),
    ref: { kind: "order", id: orderId },
    dedupeKey: p.success
      ? dedupeKeys.paymentSuccess(paymentId)
      : dedupeKeys.paymentFailed(paymentId),
  });
}

export interface CouponForNotification extends CouponSnapshot {
  id: Id;
  startsAt: Date | null;
  type: "public" | "private";
  status: "active" | "inactive";
  allowedUsers: Id[];
}

/**
 * بعد از ساخت موفق Coupon و فقط وقتی ادمین «اطلاع‌رسانی» را زده باشد.
 * Snapshot اطلاعات کد در متن ذخیره می‌شود؛ `ref` فقط ردیابی است.
 */
export async function notifyCouponCreated(coupon: CouponForNotification, now = new Date()): Promise<void> {
  if (coupon.status !== "active" || coupon.expiresAt <= now) return;
  const couponId = String(coupon.id);
  const publishAt = coupon.startsAt && coupon.startsAt > now ? coupon.startsAt : now;

  if (coupon.type === "public") {
    await safeCreateNotification({
      audience: "public",
      type: "coupon",
      ...publicCouponText(coupon),
      link: NOTIFICATION_LINKS.coupons,
      ref: { kind: "coupon", id: couponId },
      publishAt,
      expiresAt: coupon.expiresAt,
      dedupeKey: dedupeKeys.couponPublic(couponId),
    });
    return;
  }

  await safeCreateNotifications(
    coupon.allowedUsers.map(
      (userId): NewNotification => ({
        audience: "user",
        userId,
        type: "coupon",
        ...personalCouponText(coupon),
        link: NOTIFICATION_LINKS.coupons,
        ref: { kind: "coupon", id: couponId },
        publishAt,
        expiresAt: coupon.expiresAt,
        dedupeKey: dedupeKeys.couponPersonal(couponId, String(userId)),
      }),
    ),
  );
}

export function buildCouponExpiryReminder(p: {
  coupon: CouponSnapshot & { id: Id };
  userId: Id;
  hours: number;
}): NewNotification {
  const couponId = String(p.coupon.id);
  return {
    audience: "user",
    userId: p.userId,
    type: "coupon_expiry",
    ...couponExpiryReminderText(p.coupon, p.hours),
    link: NOTIFICATION_LINKS.coupons,
    ref: { kind: "coupon", id: couponId },
    expiresAt: p.coupon.expiresAt,
    dedupeKey: dedupeKeys.couponExpiry(couponId, String(p.userId), p.hours),
  };
}

export async function notifyReferralSignup(p: { referralId: Id; referrerId: Id }): Promise<void> {
  const referralId = String(p.referralId);
  await safeCreateNotification({
    audience: "user",
    userId: p.referrerId,
    type: "referral",
    ...referralSignupText(),
    link: NOTIFICATION_LINKS.referral,
    ref: { kind: "referral", id: referralId },
    dedupeKey: dedupeKeys.referralSignup(referralId),
  });
}

export async function notifyReferralFirstPurchase(p: {
  referralId: Id;
  referrerId: Id;
}): Promise<void> {
  const referralId = String(p.referralId);
  await safeCreateNotification({
    audience: "user",
    userId: p.referrerId,
    type: "referral",
    ...referralFirstPurchaseText(),
    link: NOTIFICATION_LINKS.referral,
    ref: { kind: "referral", id: referralId },
    dedupeKey: dedupeKeys.referralFirstPurchase(referralId),
  });
}

export async function notifyReferralReward(p: {
  referralId: Id;
  referrerId: Id;
  coupon: CouponSnapshot;
}): Promise<void> {
  const referralId = String(p.referralId);
  await safeCreateNotification({
    audience: "user",
    userId: p.referrerId,
    type: "referral",
    ...referralRewardText(p.coupon),
    link: NOTIFICATION_LINKS.coupons,
    ref: { kind: "referral", id: referralId },
    expiresAt: p.coupon.expiresAt,
    dedupeKey: dedupeKeys.referralReward(referralId),
  });
}
