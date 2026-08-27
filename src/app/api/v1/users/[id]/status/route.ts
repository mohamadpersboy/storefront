import { connectToDatabase } from "@/lib/db/connect";
import { User } from "@/models/User";
import { PERMISSIONS, ROLES } from "@/lib/constants/rbac";
import { requireApiUser } from "@/lib/auth/api-guard";
import { apiError, apiSuccess } from "@/lib/utils/api-response";
import { updateUserStatusSchema } from "@/lib/validations/users";
import { logActivity } from "@/lib/audit/log-activity";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireApiUser(PERMISSIONS.USERS_UPDATE);
  if (guard.response) return guard.response;
  const { user: actor } = guard;

  const { id } = await params;
  const json = await request.json().catch(() => null);
  const parsed = updateUserStatusSchema.safeParse(json);

  if (!parsed.success) {
    return apiError("مقدار ارسالی معتبر نیست", {
      status: 422,
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  if (id === actor.id) {
    return apiError("امکان غیرفعال کردن حساب خودتان وجود ندارد", {
      status: 400,
    });
  }

  await connectToDatabase();
  const target = await User.findById(id);

  if (!target) {
    return apiError("کاربر یافت نشد", { status: 404 });
  }

  if (
    (target.role === ROLES.ADMIN || target.role === ROLES.SUPER_ADMIN) &&
    actor.role !== ROLES.SUPER_ADMIN
  ) {
    return apiError("شما مجاز به تغییر وضعیت این کاربر نیستید", {
      status: 403,
    });
  }

  const { isActive } = parsed.data;

  if (!isActive && target.role === ROLES.SUPER_ADMIN) {
    const otherActiveSuperAdmins = await User.countDocuments({
      role: ROLES.SUPER_ADMIN,
      isActive: true,
      _id: { $ne: target._id },
    });
    if (otherActiveSuperAdmins === 0) {
      return apiError("باید حداقل یک مدیر کل فعال در سیستم باقی بماند", {
        status: 400,
      });
    }
  }

  target.isActive = isActive;
  await target.save();

  await logActivity({
    actor,
    action: "user.status_changed",
    targetType: "User",
    targetId: target.id,
    description: `حساب کاربر ${target.phoneNumber} ${isActive ? "فعال" : "غیرفعال"} شد`,
  });

  return apiSuccess(
    { id: target.id, isActive: target.isActive },
    { message: isActive ? "کاربر فعال شد" : "کاربر غیرفعال شد" },
  );
}
