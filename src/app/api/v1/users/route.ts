import type { NextRequest } from "next/server";
import type { Types } from "mongoose";
import { connectToDatabase } from "@/lib/db/connect";
import { User, type IUser } from "@/models/User";
import { PERMISSIONS } from "@/lib/constants/rbac";
import { requireApiUser } from "@/lib/auth/api-guard";
import { apiError, apiSuccess } from "@/lib/utils/api-response";
import { usersListQuerySchema } from "@/lib/validations/users";

type LeanUser = IUser & { _id: Types.ObjectId };

export async function GET(request: NextRequest) {
  const guard = await requireApiUser(PERMISSIONS.USERS_READ);
  if (guard.response) return guard.response;

  const { searchParams } = request.nextUrl;
  const parsed = usersListQuerySchema.safeParse({
    page: searchParams.get("page") ?? undefined,
    limit: searchParams.get("limit") ?? undefined,
    search: searchParams.get("search") ?? undefined,
    role: searchParams.get("role") ?? undefined,
  });

  if (!parsed.success) {
    return apiError("پارامترهای جستجو معتبر نیستند", {
      status: 422,
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  const { page, limit, search, role } = parsed.data;
  await connectToDatabase();

  const filter: Record<string, unknown> = {};
  if (role) filter.role = role;
  if (search) {
    // Escape regex special characters so a search like "09121234567"
    // or a name with parentheses can't break the pattern.
    const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.$or = [
      { phoneNumber: { $regex: escaped, $options: "i" } },
      { fullName: { $regex: escaped, $options: "i" } },
    ];
  }

  const result = await User.paginate(filter, {
    page,
    limit,
    sort: { createdAt: -1 },
    lean: true,
  });

  return apiSuccess(
    (result.docs as LeanUser[]).map((u) => ({
      id: String(u._id),
      fullName: u.fullName ?? null,
      phoneNumber: u.phoneNumber,
      role: u.role,
      isActive: u.isActive,
      lastLoginAt: u.lastLoginAt ?? null,
      createdAt: u.createdAt,
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
