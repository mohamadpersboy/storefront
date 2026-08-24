import type { NextRequest } from "next/server";
import type { Types } from "mongoose";
import { connectToDatabase } from "@/lib/db/connect";
import { Order, type IOrder } from "@/models/Order";
import { Product } from "@/models/Product";
import { User } from "@/models/User";
import { getNextSequence } from "@/models/Counter";
import { PERMISSIONS } from "@/lib/constants/rbac";
import { requireApiUser } from "@/lib/auth/api-guard";
import { apiError, apiSuccess } from "@/lib/utils/api-response";
import { computeFinalPrice, computePrepayment } from "@/lib/utils/pricing";
import { createOrderSchema, ordersListQuerySchema } from "@/lib/validations/orders";

const ORDER_NUMBER_OFFSET = 10_000;

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

  const json = await request.json().catch(() => null);
  const parsed = createOrderSchema.safeParse(json);

  if (!parsed.success) {
    return apiError("اطلاعات ارسالی معتبر نیست", {
      status: 422,
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  const { customerId, items, shippingAddress, shippingCost, paymentMethod, prepaymentPercent, notes } =
    parsed.data;

  await connectToDatabase();

  const customer = await User.findById(customerId);
  if (!customer) {
    return apiError("مشتری یافت نشد", { status: 400 });
  }

  // Resolve every line item against the real, current product/variant
  // data — never trust a client-submitted price. This is also where
  // the price/attributes snapshot for the order is taken.
  const orderItems = [];
  for (const item of items) {
    const product = await Product.findById(item.productId);
    if (!product) {
      return apiError(`محصول با شناسه ${item.productId} یافت نشد`, { status: 400 });
    }
    const variant = product.variants.find(
      (v) => v._id.toString() === item.variantId,
    );
    if (!variant) {
      return apiError(`Variant انتخاب‌شده برای «${product.title}» یافت نشد`, {
        status: 400,
      });
    }
    if (!variant.isActive) {
      return apiError(`Variant انتخاب‌شده برای «${product.title}» غیرفعال است`, {
        status: 400,
      });
    }
    if (variant.stock < item.quantity) {
      return apiError(
        `موجودی «${product.title}» کافی نیست (موجودی: ${variant.stock})`,
        { status: 400 },
      );
    }

    const unitPrice = computeFinalPrice(
      variant.price,
      variant.discountPercent,
      variant.discountAmount,
    );

    orderItems.push({
      product: product._id,
      variantId: variant._id,
      title: product.title,
      unit: variant.unit,
      colorName: null, // resolved client-side for display; not critical to persist name if colorId ever changes
      attributes: variant.attributes,
      unitPrice,
      quantity: item.quantity,
      lineTotal: unitPrice * item.quantity,
    });
  }

  const subtotal = orderItems.reduce((sum, i) => sum + i.lineTotal, 0);
  const totalAmount = subtotal + shippingCost;
  const { prepaymentAmount, remainingAmount, prepaymentPercent: resolvedPercent } =
    computePrepayment(paymentMethod, totalAmount, prepaymentPercent);

  const orderNumber = ORDER_NUMBER_OFFSET + (await getNextSequence("orderNumber"));

  // Decrement stock for each variant sold.
  for (const item of items) {
    await Product.updateOne(
      { _id: item.productId, "variants._id": item.variantId },
      { $inc: { "variants.$.stock": -item.quantity } },
    );
  }

  const order = await Order.create({
    orderNumber,
    customer: customer._id,
    items: orderItems,
    shippingAddress,
    subtotal,
    shippingCost,
    totalAmount,
    paymentMethod,
    prepaymentPercent: resolvedPercent,
    prepaymentAmount,
    remainingAmount,
    notes,
  });

  return apiSuccess(
    { id: order.id, orderNumber: order.orderNumber },
    { message: "سفارش با موفقیت ثبت شد", status: 201 },
  );
}
