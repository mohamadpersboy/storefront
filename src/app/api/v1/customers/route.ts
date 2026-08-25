import type { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db/connect";
import { User } from "@/models/User";
import "@/models/Order"; // registers "Order" for the $lookup below
import { ROLES, PERMISSIONS } from "@/lib/constants/rbac";
import { requireApiUser } from "@/lib/auth/api-guard";
import { apiError, apiSuccess } from "@/lib/utils/api-response";
import { customersListQuerySchema } from "@/lib/validations/customers";

interface CustomerAggregateRow {
  _id: unknown;
  fullName?: string;
  phoneNumber: string;
  isActive: boolean;
  createdAt: Date;
  ordersCount: number;
  totalSpent: number;
}

export async function GET(request: NextRequest) {
  const guard = await requireApiUser(PERMISSIONS.CUSTOMERS_READ);
  if (guard.response) return guard.response;

  const { searchParams } = request.nextUrl;
  const parsed = customersListQuerySchema.safeParse({
    page: searchParams.get("page") ?? undefined,
    limit: searchParams.get("limit") ?? undefined,
    search: searchParams.get("search") ?? undefined,
  });

  if (!parsed.success) {
    return apiError("پارامترهای جستجو معتبر نیستند", {
      status: 422,
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  const { page, limit, search } = parsed.data;
  await connectToDatabase();

  // Soft-delete is normally handled by User's find-hook, but that hook
  // doesn't run for aggregate() — so it's applied explicitly here.
  const match: Record<string, unknown> = { role: ROLES.CUSTOMER, deletedAt: null };
  if (search) {
    const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    match.$or = [
      { phoneNumber: { $regex: escaped, $options: "i" } },
      { fullName: { $regex: escaped, $options: "i" } },
    ];
  }

  const [totalDocs, rows] = await Promise.all([
    User.countDocuments(match),
    User.aggregate<CustomerAggregateRow>([
      { $match: match },
      { $sort: { createdAt: -1 } },
      { $skip: (page - 1) * limit },
      { $limit: limit },
      {
        $lookup: {
          from: "orders",
          localField: "_id",
          foreignField: "customer",
          as: "orders",
        },
      },
      {
        $addFields: {
          ordersCount: { $size: "$orders" },
          totalSpent: { $sum: "$orders.totalAmount" },
        },
      },
      {
        $project: {
          fullName: 1,
          phoneNumber: 1,
          isActive: 1,
          createdAt: 1,
          ordersCount: 1,
          totalSpent: 1,
        },
      },
    ]),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalDocs / limit));

  return apiSuccess(
    rows.map((r) => ({
      id: String(r._id),
      fullName: r.fullName ?? null,
      phoneNumber: r.phoneNumber,
      isActive: r.isActive,
      createdAt: r.createdAt,
      ordersCount: r.ordersCount,
      totalSpent: r.totalSpent,
    })),
    {
      pagination: {
        totalDocs,
        totalPages,
        page,
        limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    },
  );
}
