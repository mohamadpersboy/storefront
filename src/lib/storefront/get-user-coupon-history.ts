import { CouponRedemption } from "@/models/CouponRedemption";
import { Order } from "@/models/Order";
import type { OrderStatus } from "@/lib/constants/order-status";

export const COUPON_HISTORY_PAGE_SIZE = 10;

export type CouponHistoryEntry = {
  id: string;
  code: string;
  discountPercentage: number;
  discountAmount: number;
  orderId: string;
  orderNumber: number;
  orderStatus: OrderStatus;
  usedAt: string;
};

export type CouponHistoryResult = {
  items: CouponHistoryEntry[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

type LeanRedemption = {
  _id: unknown;
  order: unknown;
  discountAmount: number;
  createdAt: Date;
};

type LeanOrderForCoupon = {
  _id: unknown;
  orderNumber: number;
  status: OrderStatus;
  discount: { couponCode: string | null; discountPercentage: number } | null;
};

/**
 * تاریخچه کدهای تخفیف استفاده‌شده — دقیقاً هم‌الگو با عنوان/زیرعنوان
 * از قبل ثبت‌شده در `/account` («کدهای تخفیف من» / «کدهای تخفیف
 * استفاده‌شده»): این صفحه یک لیست کدهای *قابل‌استفاده* نیست، یک
 * تاریخچه است.
 *
 * منبع اصلی داده `CouponRedemption` است (نه خودِ `Coupon`) چون طبق
 * کامنت خودِ آن مدل «یک ردیف به‌ازای هر استفاده موفق» است — همان
 * چیزی که علیه `perUserLimit` شمرده می‌شود، مستقل از این‌که سفارش
 * بعداً لغو شود یا نه. کد/درصد تخفیف هم از Snapshot خودِ `Order`
 * (`order.discount`) خوانده می‌شود، نه با Populate کردن `Coupon` —
 * چون `Coupon` قابل Hard Delete است (`DELETE /api/v1/coupons/[id]`)
 * ولی Snapshot سفارش همیشه باقی می‌ماند؛ این‌طور تاریخچه حتی بعد از
 * حذف کامل یک کد تخفیف هم درست باقی می‌ماند.
 */
export async function getUserCouponHistory(
  userId: string,
  page: number,
  pageSize = COUPON_HISTORY_PAGE_SIZE,
): Promise<CouponHistoryResult> {
  const total = await CouponRedemption.countDocuments({ user: userId });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);

  const redemptions = (await CouponRedemption.find({ user: userId })
    .sort({ createdAt: -1 })
    .skip((safePage - 1) * pageSize)
    .limit(pageSize)
    .select("order discountAmount createdAt")
    .lean()) as unknown as LeanRedemption[];

  const orderIds = redemptions.map((r) => String(r.order));
  const orders = (await Order.find({ _id: { $in: orderIds } })
    .select("orderNumber status discount.couponCode discount.discountPercentage")
    .lean()) as unknown as LeanOrderForCoupon[];
  const orderById = new Map(orders.map((o) => [String(o._id), o]));

  const items = redemptions
    .map((redemption) => {
      const order = orderById.get(String(redemption.order));
      // اگر سفارش پیدا نشود (نباید پیش بیاید، سفارش‌ها Hard Delete
      // نمی‌شوند) یا Snapshot تخفیفش کد نداشته باشد، این ردیف را
      // نادیده می‌گیریم — نمایش یک ردیف بی‌معنی بهتر از خطا نیست،
      // اما هیچ داده‌ای هم نباید ساختگی پر شود.
      if (!order?.discount?.couponCode) return null;

      return {
        id: String(redemption._id),
        code: order.discount.couponCode,
        discountPercentage: order.discount.discountPercentage,
        discountAmount: redemption.discountAmount,
        orderId: String(order._id),
        orderNumber: order.orderNumber,
        orderStatus: order.status,
        usedAt: redemption.createdAt.toISOString(),
      };
    })
    .filter((entry): entry is CouponHistoryEntry => entry !== null);

  return { items, total, page: safePage, pageSize, totalPages };
}
