import { connectToDatabase } from "@/lib/db/connect";
import { User } from "@/models/User";
import { PERMISSIONS } from "@/lib/constants/rbac";
import { requireApiUser } from "@/lib/auth/api-guard";
import { apiError, apiSuccess } from "@/lib/utils/api-response";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireApiUser(PERMISSIONS.USERS_READ);
  if (guard.response) return guard.response;

  const { id } = await params;
  await connectToDatabase();

  const user = await User.findById(id).lean();
  if (!user) {
    return apiError("کاربر یافت نشد", { status: 404 });
  }

  return apiSuccess({
    id: String(user._id),
    fullName: user.fullName ?? null,
    phoneNumber: user.phoneNumber,
    role: user.role,
    isActive: user.isActive,
    lastLoginAt: user.lastLoginAt ?? null,
    createdAt: user.createdAt,
  });
}
