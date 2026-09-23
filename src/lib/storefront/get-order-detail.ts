import mongoose from "mongoose";
import { Order, type IOrderDiscount, type PaymentMethod } from "@/models/Order";
import type { OrderStatus } from "@/lib/constants/order-status";

export type OrderDetailItem = {
  title: string;
  unit: string;
  colorName: string | null;
  attributes: { name: string; value: string }[];
  unitPrice: number;
  quantity: number;
  lineTotal: number;
};

export type OrderDetailStatusEntry = {
  status: OrderStatus;
  changedAt: string;
  note: string;
};

export type OrderDetail = {
  id: string;
  orderNumber: number;
  status: OrderStatus;
  createdAt: string;
  items: OrderDetailItem[];
  shippingAddress: {
    recipientName: string;
    phoneNumber: string;
    province: string;
    city: string;
    addressLine: string;
    postalCode: string;
  };
  subtotal: number;
  shippingCost: number;
  discount: IOrderDiscount | null;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  prepaymentAmount: number;
  remainingAmount: number;
  statusHistory: OrderDetailStatusEntry[];
};

/**
 * برچسب یک ردیف تخفیف سفارش — هم‌الگو با متن دقیق Dashboard
 * (`order-detail-card.tsx`) تا واژه‌بندی «تخفیف کد X» / «پاداش
 * پرداخت آنلاین/ترکیبی» در کل پروژه یکسان بماند؛ چون آن فایل
 * Client Component داشبورد است (متن Inline، نه یک تابع مستقل قابل
 * Import)، همین منطق کوچک اینجا با همان الفاظ بازنویسی شد — نه یک
 * منطق جدید.
 */
export function formatOrderDiscountLabel(discount: IOrderDiscount): string {
  if (discount.source === "coupon") {
    return `تخفیف کد ${discount.couponCode}`;
  }
  return `پاداش پرداخت ${discount.rewardType === "online" ? "آنلاین" : "ترکیبی"}`;
}

type LeanOrderDetail = {
  _id: unknown;
  orderNumber: number;
  customer: unknown;
  status: OrderStatus;
  createdAt: Date;
  items: OrderDetailItem[];
  shippingAddress: OrderDetail["shippingAddress"];
  subtotal: number;
  shippingCost: number;
  discount: IOrderDiscount | null;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  prepaymentAmount: number;
  remainingAmount: number;
  statusHistory: { status: OrderStatus; changedAt: Date; note?: string }[];
};

/**
 * سفارش تک‌مورد برای صفحه `/orders/[id]` — فقط اگر واقعاً متعلق به
 * همین کاربر باشد برمی‌گردد؛ در غیر این صورت `null` (صفحه با همان
 * `null`، `notFound()` صدا می‌زند — ۴۰۴ نه ۴۰۳، تا حتی وجودِ سفارشِ
 * یک کاربر دیگر هم به کاربر فعلی لو نرود). فیلد `changedBy` عمداً
 * Select/برگردانده نمی‌شود — نام کارمند ادمین اطلاعات داخلی است، نه
 * چیزی که مشتری باید ببیند؛ فقط Status/زمان/یادداشتِ هر تغییر (که
 * ممکن است خودِ ادمین برای توضیح به مشتری نوشته باشد، مثل «به دلیل
 * نبود موجودی») نمایش داده می‌شود. فیلد کلیِ `order.notes` هم عمداً
 * برگردانده نمی‌شود — آن یک یادداشت داخلی آزاد است، نه لزوماً
 * پیامی خطاب به مشتری.
 */
export async function getOrderDetailForCustomer(
  orderId: string,
  userId: string,
): Promise<OrderDetail | null> {
  if (!mongoose.isValidObjectId(orderId)) return null;

  const order = (await Order.findById(orderId)
    .select(
      "orderNumber customer status createdAt items shippingAddress subtotal shippingCost discount totalAmount paymentMethod prepaymentAmount remainingAmount statusHistory.status statusHistory.changedAt statusHistory.note",
    )
    .lean()) as unknown as LeanOrderDetail | null;

  if (!order || String(order.customer) !== userId) return null;

  return {
    id: String(order._id),
    orderNumber: order.orderNumber,
    status: order.status,
    createdAt: order.createdAt.toISOString(),
    items: order.items,
    shippingAddress: order.shippingAddress,
    subtotal: order.subtotal,
    shippingCost: order.shippingCost,
    discount: order.discount,
    totalAmount: order.totalAmount,
    paymentMethod: order.paymentMethod,
    prepaymentAmount: order.prepaymentAmount,
    remainingAmount: order.remainingAmount,
    statusHistory: order.statusHistory.map((entry) => ({
      status: entry.status,
      changedAt: entry.changedAt.toISOString(),
      note: entry.note ?? "",
    })),
  };
}
