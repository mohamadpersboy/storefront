import { connectToDatabase } from "@/lib/db/connect";
import { User } from "@/models/User";
import { Order } from "@/models/Order";
import { PERMISSIONS } from "@/lib/constants/rbac";
import { requireApiUser } from "@/lib/auth/api-guard";
import { apiError, apiSuccess } from "@/lib/utils/api-response";

const RECENT_ORDERS_LIMIT = 20;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireApiUser(PERMISSIONS.CUSTOMERS_READ);
  if (guard.response) return guard.response;

  const { id } = await params;
  await connectToDatabase();

  const customer = await User.findOne({ _id: id, role: "customer" }).lean();
  if (!customer) {
    return apiError("مشتری یافت نشد", { status: 404 });
  }

  const orders = await Order.find({ customer: id })
    .sort({ createdAt: -1 })
    .limit(RECENT_ORDERS_LIMIT)
    .select("orderNumber status totalAmount createdAt")
    .lean();

  const ordersCount = await Order.countDocuments({ customer: id });
  const totalSpent = orders.reduce((sum, o) => sum + o.totalAmount, 0);

  return apiSuccess({
    id: String(customer._id),
    fullName: customer.fullName ?? null,
    phoneNumber: customer.phoneNumber,
    isActive: customer.isActive,
    createdAt: customer.createdAt,
    lastLoginAt: customer.lastLoginAt ?? null,
    ordersCount,
    orders: orders.map((o) => ({
      id: String(o._id),
      orderNumber: o.orderNumber,
      status: o.status,
      totalAmount: o.totalAmount,
      createdAt: o.createdAt,
    })),
    // Sum over the fetched page only when the customer has more orders
    // than RECENT_ORDERS_LIMIT — noted via `partialTotalSpent` so the
    // UI can label it honestly instead of implying a full lifetime sum.
    totalSpent,
    partialTotalSpent: ordersCount > orders.length,
  });
}
