import type { OrderStatus } from "@/lib/constants/order-status";
import { formatJalali } from "@/lib/utils/jalali";
import { formatToman, toPersianDigits } from "@/lib/utils/format";

/**
 * تمام متن‌های اعلان یک‌جا (هم‌الگو با قالب‌های پیامک) تا تغییر متن
 * فقط یک فایل را عوض کند. خروجی: `{ title, content }` متن ساده.
 */
export interface NotificationText {
  title: string;
  content: string;
}

export interface CouponSnapshot {
  code: string;
  discountPercentage: number;
  maxDiscountAmount: number | null;
  minOrderAmount: number;
  expiresAt: Date;
}

function num(value: number): string {
  return toPersianDigits(value);
}

function couponLines(c: CouponSnapshot): string[] {
  const lines = [
    `کد تخفیف: ${c.code}`,
    `میزان تخفیف: ${num(c.discountPercentage)}٪${
      c.maxDiscountAmount ? ` (حداکثر ${formatToman(c.maxDiscountAmount)})` : ""
    }`,
  ];
  if (c.minOrderAmount > 0) lines.push(`حداقل مبلغ سفارش: ${formatToman(c.minOrderAmount)}`);
  lines.push(`اعتبار تا: ${formatJalali(c.expiresAt.toISOString())}`);
  return lines;
}

export function orderCreatedText(orderNumber: number): NotificationText {
  return {
    title: "سفارش شما ثبت شد",
    content: `سفارش شماره ${num(orderNumber)} با موفقیت ثبت شد.`,
  };
}

const ORDER_STATUS_TITLES: Partial<Record<OrderStatus, string>> = {
  confirmed: "سفارش شما تأیید شد",
  processing: "سفارش شما در حال آماده‌سازی است",
  ready_to_ship: "سفارش شما آماده ارسال است",
  shipped: "سفارش شما ارسال شد",
  delivered: "سفارش شما تحویل داده شد",
  cancelled: "سفارش شما لغو شد",
  returned: "سفارش شما مرجوع شد",
};

/** برای وضعیتی که پیام ندارد (`pending`) `null` برمی‌گرداند. */
export function orderStatusText(
  status: OrderStatus,
  orderNumber: number,
): NotificationText | null {
  const title = ORDER_STATUS_TITLES[status];
  if (!title) return null;
  return { title, content: `وضعیت سفارش شماره ${num(orderNumber)} تغییر کرد.` };
}

export function paymentSuccessText(orderNumber: number): NotificationText {
  return {
    title: "پرداخت شما با موفقیت انجام شد",
    content: `پرداخت سفارش شماره ${num(orderNumber)} تأیید شد.`,
  };
}

export function paymentFailedText(orderNumber: number): NotificationText {
  return {
    title: "پرداخت ناموفق بود",
    content: `پرداخت سفارش شماره ${num(orderNumber)} انجام نشد. در صورت کسر مبلغ، مبلغ به کیف پول یا حساب شما برمی‌گردد.`,
  };
}

export function publicCouponText(c: CouponSnapshot): NotificationText {
  return {
    title: `🎁 کد تخفیف ${num(c.discountPercentage)}٪ فعال شد`,
    content: couponLines(c).join("\n"),
  };
}

export function personalCouponText(c: CouponSnapshot): NotificationText {
  return {
    title: "🎁 یک کد تخفیف اختصاصی برای شما فعال شد",
    content: couponLines(c).join("\n"),
  };
}

export function couponExpiryReminderText(c: CouponSnapshot, hoursLeft: number): NotificationText {
  return {
    title:
      hoursLeft <= 24
        ? "⏰ کد تخفیف شما فقط ۲۴ ساعت دیگر اعتبار دارد"
        : "⏰ کد تخفیف شما به‌زودی منقضی می‌شود",
    content: couponLines(c).join("\n"),
  };
}

export function referralSignupText(): NotificationText {
  return {
    title: "🎉 یکی از زیرمجموعه‌های شما ثبت‌نام کرد",
    content: "با اولین خرید او، پاداش شما فعال می‌شود.",
  };
}

export function referralFirstPurchaseText(): NotificationText {
  return {
    title: "🎉 یکی از زیرمجموعه‌های شما اولین خرید خود را انجام داد",
    content: "وضعیت زیرمجموعه‌ها را در صفحه دعوت دوستان ببینید.",
  };
}

export function referralRewardText(c: CouponSnapshot): NotificationText {
  return {
    title: "💰 پاداش دعوت دوستان برای شما ثبت شد",
    content: ["به‌خاطر فعالیت زیرمجموعه شما، یک کد تخفیف دریافت کردید.", ...couponLines(c)].join(
      "\n",
    ),
  };
}

export function dailySpecialOfferText(productCount: number): NotificationText {
  return {
    title: `🔥 ${num(productCount)} محصول جدید به پیشنهاد شگفت‌انگیز اضافه شده است`,
    content: "فرصت را از دست ندهید!",
  };
}
