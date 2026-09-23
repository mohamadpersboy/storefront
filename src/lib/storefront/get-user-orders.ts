import { Order } from "@/models/Order";
import type { OrderStatus } from "@/lib/constants/order-status";

export const ORDERS_PAGE_SIZE = 10;

export type OrderListStatusFilter = "all" | "in_progress" | "delivered" | "cancelled";

/**
 * چهار تب صفحه «سفارش‌های من» — تعداد و اسم تب‌ها دقیقاً طبق رفرنس
 * کارفرما (همه/در حال انجام/تحویل‌شده/لغوشده)، اما ۸ Status واقعی
 * پروژه (`ORDER_STATUSES`) باید به همین ۴ گروه نگاشت شوند:
 * - «در حال انجام» = هر Status پیش از تحویل نهایی (`pending` تا `shipped`)
 * - «لغوشده» = هم `cancelled` و هم `returned` — هر دو یعنی سفارش در
 *   نهایت به دست مشتری نرسید/برگشت خورد؛ رفرنس فقط یک تب منفی دارد،
 *   پس این دو Status Terminal منفی زیر همان یک تب جمع شدند (نه یک تب
 *   پنجم جداگانه که در رفرنس نبود).
 */
export const ORDER_STATUS_GROUPS: Record<OrderListStatusFilter, OrderStatus[] | null> = {
  all: null,
  in_progress: ["pending", "confirmed", "processing", "ready_to_ship", "shipped"],
  delivered: ["delivered"],
  cancelled: ["cancelled", "returned"],
};

export type OrderListItem = {
  id: string;
  orderNumber: number;
  status: OrderStatus;
  createdAt: string;
  totalAmount: number;
  itemsSummary: string;
  itemsCount: number;
};

type LeanOrderForList = {
  _id: unknown;
  orderNumber: number;
  status: OrderStatus;
  createdAt: Date;
  totalAmount: number;
  items: { title: string }[];
};

/**
 * متن خلاصه اقلام یک سفارش برای ردیف لیست — عنوان اولین قلم +
 * درصورت وجود قلم دیگر، «و N کالای دیگر». تابع خالص و جدا شد چون
 * منطق نگارش فارسی آن (مفرد/جمع، عدد فارسی) به‌تنهایی قابل تست است.
 */
export function buildOrderItemsSummary(items: { title: string }[]): string {
  if (items.length === 0) return "";
  const [first, ...rest] = items;
  if (rest.length === 0) return first.title;
  return `${first.title} و ${rest.length.toLocaleString("fa-IR")} کالای دیگر`;
}

export type UserOrdersResult = {
  items: OrderListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export async function getUserOrders(
  userId: string,
  filter: OrderListStatusFilter,
  page: number,
  pageSize = ORDERS_PAGE_SIZE,
): Promise<UserOrdersResult> {
  const statusGroup = ORDER_STATUS_GROUPS[filter];
  const query = {
    customer: userId,
    ...(statusGroup ? { status: { $in: statusGroup } } : {}),
  };

  const total = await Order.countDocuments(query);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);

  const orders = (await Order.find(query)
    .sort({ createdAt: -1 })
    .skip((safePage - 1) * pageSize)
    .limit(pageSize)
    .select("orderNumber status createdAt totalAmount items.title")
    .lean()) as unknown as LeanOrderForList[];

  return {
    items: orders.map((order) => ({
      id: String(order._id),
      orderNumber: order.orderNumber,
      status: order.status,
      createdAt: order.createdAt.toISOString(),
      totalAmount: order.totalAmount,
      itemsSummary: buildOrderItemsSummary(order.items),
      itemsCount: order.items.length,
    })),
    total,
    page: safePage,
    pageSize,
    totalPages,
  };
}
