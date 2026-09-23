import mongoose from "mongoose";
import { Order, type IOrderDiscount, type PaymentMethod } from "@/models/Order";
import { Product } from "@/models/Product";
import { Color } from "@/models/Color";
import type { OrderStatus } from "@/lib/constants/order-status";

export type OrderDetailItem = {
  title: string;
  unit: string;
  colorName: string | null;
  colorHex: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  /**
   * `null` یعنی محصول دیگر در دسترس نیست — یا کاملاً حذف شده، یا
   * `status` آن دیگر `published` نیست (که صفحه محصول هم برایش
   * `notFound()` می‌دهد؛ نگاه کن `get-product-detail.ts`). در هر دو
   * حالت لینک دادن به آن یعنی مشتری مستقیم به ۴۰۴ می‌خورد، پس اصلاً
   * لینک ساخته نمی‌شود.
   */
  product: { slug: string; imageUrl: string } | null;
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

type LeanOrderItem = {
  product: unknown;
  title: string;
  unit: string;
  colorName: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
};

type LeanOrderDetail = {
  _id: unknown;
  orderNumber: number;
  customer: unknown;
  status: OrderStatus;
  createdAt: Date;
  items: LeanOrderItem[];
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
      "orderNumber customer status createdAt items.product items.title items.unit items.colorName items.unitPrice items.quantity items.lineTotal shippingAddress subtotal shippingCost discount totalAmount paymentMethod prepaymentAmount remainingAmount statusHistory.status statusHistory.changedAt statusHistory.note",
    )
    .lean()) as unknown as LeanOrderDetail | null;

  if (!order || String(order.customer) !== userId) return null;

  // تصویر/لینک هر قلم از خودِ محصول *فعلی* می‌آید (نه از Snapshot
  // سفارش که اصلاً تصویر ذخیره نمی‌کند) — پس هم عکس هم لینک باید
  // زنده Fetch شوند. فقط محصولِ `status: "published"` واجد شرایط
  // لینک/عکس است؛ همان فیلتر دقیق صفحه محصول (بالاتر توضیح داده
  // شد)، تا لینک هیچ‌وقت به یک ۴۰۴ نرسد.
  const productIds = [...new Set(order.items.map((item) => String(item.product)))];
  const products = (await Product.find({ _id: { $in: productIds }, status: "published" })
    .select("slug images")
    .lean()) as unknown as { _id: unknown; slug: string; images: { url: string }[] }[];
  const productById = new Map(products.map((p) => [String(p._id), p]));

  // رنگ روی خودِ سفارش فقط اسم (`colorName`) دارد، نه کدِ Hex —
  // چون `Color` یک مجموعه سراسری با نام یکتا است (نگاه کن
  // `models/Color.ts`)، کدِ رنگ از همان‌جا با تطبیق نام پیدا می‌شود؛
  // این مستقل از باقی‌ماندن/حذف‌شدن محصول کار می‌کند (رنگ‌ها حذف
  // نمی‌شوند، فقط ممکن است `isActive: false` شوند که برای همین
  // نمایش صرفاً تاریخی اهمیتی ندارد).
  const colorNames = [...new Set(order.items.map((item) => item.colorName).filter((n): n is string => Boolean(n)))];
  const colors = (colorNames.length
    ? await Color.find({ name: { $in: colorNames } })
        .select("name hexCode")
        .lean()
    : []) as unknown as { name: string; hexCode: string }[];
  const hexByColorName = new Map(colors.map((c) => [c.name, c.hexCode]));

  return {
    id: String(order._id),
    orderNumber: order.orderNumber,
    status: order.status,
    createdAt: order.createdAt.toISOString(),
    items: order.items.map((item) => {
      const product = productById.get(String(item.product));
      return {
        title: item.title,
        unit: item.unit,
        colorName: item.colorName,
        colorHex: item.colorName ? (hexByColorName.get(item.colorName) ?? null) : null,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        lineTotal: item.lineTotal,
        product: product ? { slug: product.slug, imageUrl: product.images[0]?.url ?? "" } : null,
      };
    }),
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
