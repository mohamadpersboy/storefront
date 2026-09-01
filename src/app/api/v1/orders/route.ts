import type { NextRequest } from "next/server";
import type { Types } from "mongoose";
import { connectToDatabase } from "@/lib/db/connect";
import { Order, type IOrder } from "@/models/Order";
import { User } from "@/models/User";
import { PERMISSIONS } from "@/lib/constants/rbac";
import { requireApiUser } from "@/lib/auth/api-guard";
import { apiError, apiSuccess } from "@/lib/utils/api-response";
import { createOrderSchema, ordersListQuerySchema } from "@/lib/validations/orders";
import { createOrder, OrderCreationError } from "@/lib/orders/create-order";

type LeanOrder = IOrder & {
  _id: Types.ObjectId;
  customer: { _id: Types.ObjectId; fullName?: string; phoneNumber: string } | Types.ObjectId;
};

export async function GET(request: NextRequest) {
  const guard = await requireApiUser(PERMISSIONS.ORDERS_READ);
  if (guard.response) return guard.response;

  const { searchParams } = request.nextUrl;
  const parsed = ordersListQuerySchema.safeParse({
    page: searchParams.get("page") ?? undefined,
    limit: searchParams.get("limit") ?? undefined,
    search: searchParams.get("search") ?? undefined,
    status: searchParams.get("status") ?? undefined,
  });

  if (!parsed.success) {
    return apiError("پارامترهای جستجو معتبر نیستند", {
      status: 422,
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  const { page, limit, search, status } = parsed.data;
  await connectToDatabase();

  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;

  if (search) {
    const asNumber = Number(search);
    const matchingCustomers = await User.find({
      $or: [
        { phoneNumber: { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" } },
        { fullName: { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" } },
      ],
    })
      .select("_id")
      .lean();

    filter.$or = [
      ...(Number.isFinite(asNumber) && search.trim() !== ""
        ? [{ orderNumber: asNumber }]
        : []),
      { customer: { $in: matchingCustomers.map((c) => c._id) } },
    ];
  }

  const result = await Order.paginate(filter, {
    page,
    limit,
    sort: { createdAt: -1 },
    populate: { path: "customer", select: "fullName phoneNumber" },
    lean: true,
  });

  return apiSuccess(
    (result.docs as LeanOrder[]).map((o) => ({
      id: String(o._id),
      orderNumber: o.orderNumber,
      customer: o.customer,
      itemsCount: o.items.length,
      totalAmount: o.totalAmount,
      status: o.status,
      createdAt: o.createdAt,
    })),
    {
      pagination: {
        totalDocs: result.totalDocs,
        totalPages: result.totalPages,
        page: result.page ?? page,
        limit: result.limit,
        hasNextPage: result.hasNextPage,
        hasPrevPage: result.hasPrevPage,
      },
    },
  );
}

export async function POST(request: Request) {
  const guard = await requireApiUser(PERMISSIONS.ORDERS_UPDATE);
  if (guard.response) return guard.response;
  const { user: actor } = guard;

  const json = await request.json().catch(() => null);
  const parsed = createOrderSchema.safeParse(json);

  if (!parsed.success) {
    return apiError("اطلاعات ارسالی معتبر نیست", {
      status: 422,
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  const { customerId, items, shippingAddress, shippingCost, paymentMethod, prepaymentPercent, couponCode, notes } =
    parsed.data;

  await connectToDatabase();

  try {
    const { order } = await createOrder({
      customerId,
      items,
      shippingAddress,
      shippingCost,
      paymentMethod,
      prepaymentPercent,
      couponCode,
      notes,
      actorId: String(actor._id),
    });

    return apiSuccess(
      { id: order.id, orderNumber: order.orderNumber },
      { message: "سفارش با موفقیت ثبت شد", status: 201 },
    );
  } catch (error) {
    if (error instanceof OrderCreationError) {
      return apiError(error.message, { status: error.status });
    }
    throw error;
  }
}
