import { connectToDatabase } from "@/lib/db/connect";
import { Order } from "@/models/Order";
import { Product } from "@/models/Product";
import { PERMISSIONS } from "@/lib/constants/rbac";
import { requireApiUser } from "@/lib/auth/api-guard";
import { apiError, apiSuccess } from "@/lib/utils/api-response";
import { updateOrderStatusSchema } from "@/lib/validations/orders";
import { canTransitionOrderStatus, type OrderStatus } from "@/lib/constants/order-status";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireApiUser(PERMISSIONS.ORDERS_UPDATE);
  if (guard.response) return guard.response;

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

  order.status = nextStatus;
  await order.save();

  return apiSuccess(
    { id: order.id, status: order.status },
    { message: "وضعیت سفارش با موفقیت تغییر کرد" },
  );
}
