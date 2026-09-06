import { connectToDatabase } from "@/lib/db/connect";
import { Order } from "@/models/Order";
import { User } from "@/models/User";
import { PERMISSIONS } from "@/lib/constants/rbac";
import { requireApiUser } from "@/lib/auth/api-guard";
import { apiError, apiSuccess } from "@/lib/utils/api-response";
import { sendOrderStatusSms } from "@/lib/sms/send-order-status-sms";
import { logActivity } from "@/lib/audit/log-activity";
import type { OrderStatus } from "@/lib/constants/order-status";

/**
 * POST /api/v1/orders/:id/notify-status
 *
 * Manually sends the SMS for the order's *current* status to its
 * customer. Per the employer's explicit decision, order-status SMS is
 * no longer sent automatically on order creation or on any status
 * transition — this endpoint (wired to a button on the order detail
 * page) is now the only way that notification goes out.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireApiUser(PERMISSIONS.ORDERS_UPDATE);
  if (guard.response) return guard.response;

  const { id } = await params;
  await connectToDatabase();

  const order = await Order.findById(id);
  if (!order) {
    return apiError("سفارش یافت نشد", { status: 404 });
  }

  const customer = await User.findById(order.customer).select("phoneNumber").lean();
  if (!customer) {
    return apiError("مشتری این سفارش یافت نشد", { status: 404 });
  }

  try {
    await sendOrderStatusSms(customer.phoneNumber, order.orderNumber, order.status as OrderStatus);
  } catch (error) {
    console.error("Failed to send order status SMS:", error);
    return apiError("ارسال پیامک با خطا مواجه شد، دوباره تلاش کنید", { status: 502 });
  }

  await logActivity({
    actor: guard.user,
    action: "order.status_sms_sent",
    targetType: "Order",
    targetId: order.id,
    description: `پیامک وضعیت «${order.status}» سفارش #${order.orderNumber} به‌صورت دستی برای مشتری ارسال شد`,
  });

  return apiSuccess({ id: order.id }, { message: "پیامک وضعیت برای مشتری ارسال شد" });
}
