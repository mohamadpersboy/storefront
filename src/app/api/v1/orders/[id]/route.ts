import { connectToDatabase } from "@/lib/db/connect";
import { Order } from "@/models/Order";
import { PERMISSIONS } from "@/lib/constants/rbac";
import { requireApiUser } from "@/lib/auth/api-guard";
import { apiError, apiSuccess } from "@/lib/utils/api-response";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireApiUser(PERMISSIONS.ORDERS_READ);
  if (guard.response) return guard.response;

  const { id } = await params;
  await connectToDatabase();

  const order = await Order.findById(id)
    .populate("customer", "fullName phoneNumber")
    .populate("statusHistory.changedBy", "fullName phoneNumber")
    .lean();

  if (!order) {
    return apiError("سفارش یافت نشد", { status: 404 });
  }

  return apiSuccess({
    id: String(order._id),
    orderNumber: order.orderNumber,
    customer: order.customer,
    items: order.items,
    shippingAddress: order.shippingAddress,
    subtotal: order.subtotal,
    shippingCost: order.shippingCost,
    totalAmount: order.totalAmount,
    paymentMethod: order.paymentMethod,
    prepaymentPercent: order.prepaymentPercent,
    prepaymentAmount: order.prepaymentAmount,
    remainingAmount: order.remainingAmount,
    status: order.status,
    statusHistory: order.statusHistory,
    notes: order.notes,
    createdAt: order.createdAt,
  });
}
