import { connectToDatabase } from "@/lib/db/connect";
import { User } from "@/models/User";
import { PERMISSIONS, ROLES, canAssignRole } from "@/lib/constants/rbac";
import { requireApiUser } from "@/lib/auth/api-guard";
import { apiError, apiSuccess } from "@/lib/utils/api-response";
import { updateUserRoleSchema } from "@/lib/validations/users";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireApiUser(PERMISSIONS.USERS_UPDATE);
  if (guard.response) return guard.response;
  const { user: actor } = guard;

  const { id } = await params;
  const json = await request.json().catch(() => null);
  const parsed = updateUserRoleSchema.safeParse(json);

  if (!parsed.success) {
    return apiError("نقش انتخاب‌شده معتبر نیست", {
      status: 422,
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  const newRole = parsed.data.role as (typeof ROLES)[keyof typeof ROLES];

  // Never let anyone (even a Super Admin) change their own role through
  // this endpoint — prevents accidental self-lockout.
  if (id === actor.id) {
    return apiError("امکان تغییر نقش خودتان وجود ندارد", { status: 400 });
  }

  if (!canAssignRole(actor.role, newRole)) {
    return apiError(
      "شما مجاز به اختصاص این نقش نیستید",
      { status: 403 },
    );
  }

  await connectToDatabase();
  const target = await User.findById(id);

  if (!target) {
    return apiError("کاربر یافت نشد", { status: 404 });
  }

  // Protect existing admins/super_admins from being demoted by a
  // non-super_admin caller.
  if (
    (target.role === ROLES.ADMIN || target.role === ROLES.SUPER_ADMIN) &&
    actor.role !== ROLES.SUPER_ADMIN
  ) {
    return apiError("شما مجاز به تغییر نقش این کاربر نیستید", {
      status: 403,
    });
  }

  // Never leave the system with zero active Super Admins.
  if (target.role === ROLES.SUPER_ADMIN && newRole !== ROLES.SUPER_ADMIN) {
    const otherSuperAdmins = await User.countDocuments({
      role: ROLES.SUPER_ADMIN,
      isActive: true,
      _id: { $ne: target._id },
    });
    if (otherSuperAdmins === 0) {
      return apiError("باید حداقل یک مدیر کل در سیستم باقی بماند", {
        status: 400,
      });
    }
  }

  target.role = newRole;
  await target.save();

  return apiSuccess(
    { id: target.id, role: target.role },
    { message: "نقش کاربر با موفقیت تغییر کرد" },
  );
}
