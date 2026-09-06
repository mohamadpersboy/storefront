import { connectToDatabase } from "@/lib/db/connect";
import { User } from "@/models/User";
import { PERMISSIONS } from "@/lib/constants/rbac";
import { requireApiUser } from "@/lib/auth/api-guard";
import { apiError, apiSuccess } from "@/lib/utils/api-response";
import { updateUserNameSchema } from "@/lib/validations/users";
import { logActivity } from "@/lib/audit/log-activity";

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

/** Updates a user's display name. Deliberately separate from the
 * role/status endpoints — editing a name is not a privilege change,
 * so it only requires USERS_UPDATE (no self-edit restriction, no
 * role-hierarchy check like the role/status routes have). */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireApiUser(PERMISSIONS.USERS_UPDATE);
  if (guard.response) return guard.response;
  const { user: actor } = guard;

  const { id } = await params;
  const json = await request.json().catch(() => null);
  const parsed = updateUserNameSchema.safeParse(json);

  if (!parsed.success) {
    return apiError("اطلاعات ارسالی معتبر نیست", {
      status: 422,
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  await connectToDatabase();
  const target = await User.findById(id);

  if (!target) {
    return apiError("کاربر یافت نشد", { status: 404 });
  }

  const previousName = target.fullName ?? null;
  target.fullName = parsed.data.fullName;
  await target.save();

  await logActivity({
    actor,
    action: "user.name_changed",
    targetType: "User",
    targetId: target.id,
    description: `نام کاربر ${target.phoneNumber} از «${previousName ?? "بدون نام"}» به «${target.fullName}» تغییر یافت`,
  });

  return apiSuccess(
    { id: target.id, fullName: target.fullName },
    { message: "نام کاربر با موفقیت ویرایش شد" },
  );
}
