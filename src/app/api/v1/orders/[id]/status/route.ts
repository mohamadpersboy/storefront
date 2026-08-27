import { connectToDatabase } from "@/lib/db/connect";
import { Order } from "@/models/Order";
import { Product } from "@/models/Product";
import { User } from "@/models/User";
import { PERMISSIONS } from "@/lib/constants/rbac";
import { requireApiUser } from "@/lib/auth/api-guard";
import { apiError, apiSuccess } from "@/lib/utils/api-response";
import { updateOrderStatusSchema } from "@/lib/validations/orders";
import { canTransitionOrderStatus, type OrderStatus } from "@/lib/constants/order-status";
import { sendOrderStatusSms } from "@/lib/sms/send-order-status-sms";
import { logActivity } from "@/lib/audit/log-activity";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireApiUser(PERMISSIONS.ORDERS_UPDATE);
  if (guard.response) return guard.response;
  const { user: actor } = guard;

  const { id } = await params;
  const json = await request.json().catch(() => null);
  const parsed = updateOrderStatusSchema.safeParse(json);

  if (!parsed.success) {
    return apiError("وضعیت انتخاب‌شده معتبر نیست", {
      status: 422,
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  const nextStatus = parsed.data.status as OrderStatus;
  const note = parsed.data.note ?? "";

  await connectToDatabase();
  const order = await Order.findById(id);

  if (!order) {
    return apiError("سفارش یافت نشد", { status: 404 });
  }

  if (!canTransitionOrderStatus(order.status, nextStatus)) {
    return apiError(
      `تغییر وضعیت از «${order.status}» به «${nextStatus}» مجاز نیست`,
      { status: 400 },
    );
  }

  // Restore stock when an order is cancelled or returned.
  if (nextStatus === "cancelled" || nextStatus === "returned") {
    for (const item of order.items) {
      await Product.updateOne(
        { _id: item.product, "variants._id": item.variantId },
        { $inc: { "variants.$.stock": item.quantity } },
      );
    }
  }

  const previousStatus = order.status;
  order.status = nextStatus;
  order.statusHistory.push({
    status: nextStatus,
    changedAt: new Date(),
    changedBy: actor._id,
    note,
  });
  await order.save();

  await logActivity({
    actor,
    action: "order.status_changed",
    targetType: "Order",
    targetId: order.id,
    description: `وضعیت سفارش #${order.orderNumber} از «${previousStatus}» به «${nextStatus}» تغییر یافت`,
  });

  // Best-effort customer notification — a failed SMS must never fail
  // (or roll back) the status change itself.
  try {
    const customer = await User.findById(order.customer).select("phoneNumber").lean();
    if (customer) {
      await sendOrderStatusSms(customer.phoneNumber, order.orderNumber, nextStatus);
    }
  } catch (error) {
    console.error("Failed to send order status SMS:", error);
  }

  return apiSuccess(
    { id: order.id, status: order.status },
    { message: "وضعیت سفارش با موفقیت تغییر کرد" },
  );
}
