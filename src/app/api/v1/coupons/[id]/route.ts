import { connectToDatabase } from "@/lib/db/connect";
import { Coupon } from "@/models/Coupon";
import { PERMISSIONS } from "@/lib/constants/rbac";
import { requireApiUser } from "@/lib/auth/api-guard";
import { apiError, apiSuccess } from "@/lib/utils/api-response";
import { updateCouponSchema } from "@/lib/validations/coupons";
import { logActivity } from "@/lib/audit/log-activity";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireApiUser(PERMISSIONS.COUPONS_READ);
  if (guard.response) return guard.response;

  const { id } = await params;
  await connectToDatabase();

  const coupon = await Coupon.findById(id)
    .populate({ path: "allowedUsers", select: "fullName phoneNumber" })
    .lean();
  if (!coupon) {
    return apiError("کد تخفیف یافت نشد", { status: 404 });
  }

  return apiSuccess({
    id: String(coupon._id),
    code: coupon.code,
    discountPercentage: coupon.discountPercentage,
    maxDiscountAmount: coupon.maxDiscountAmount,
    minOrderAmount: coupon.minOrderAmount,
    startsAt: coupon.startsAt,
    expiresAt: coupon.expiresAt,
    status: coupon.status,
    type: coupon.type,
    allowedUsers: (
      coupon.allowedUsers as unknown as Array<{
        _id: unknown;
        fullName?: string;
        phoneNumber: string;
      }>
    ).map((u) => ({ id: String(u._id), fullName: u.fullName ?? null, phoneNumber: u.phoneNumber })),
    usageLimit: coupon.usageLimit,
    usedCount: coupon.usedCount,
    perUserLimit: coupon.perUserLimit,
    createdAt: coupon.createdAt,
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireApiUser(PERMISSIONS.COUPONS_MANAGE);
  if (guard.response) return guard.response;
  const { user: actor } = guard;

  const { id } = await params;
  const json = await request.json().catch(() => null);
  const parsed = updateCouponSchema.safeParse(json);
  if (!parsed.success) {
    return apiError("اطلاعات ارسالی معتبر نیست", {
      status: 422,
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  await connectToDatabase();
  const coupon = await Coupon.findById(id);
  if (!coupon) {
    return apiError("کد تخفیف یافت نشد", { status: 404 });
  }

  if (parsed.data.code) {
    const nextCode = parsed.data.code.toUpperCase();
    if (nextCode !== coupon.code) {
      const duplicate = await Coupon.findOne({ code: nextCode, _id: { $ne: coupon._id } });
      if (duplicate) {
        return apiError("این کد از قبل ثبت شده است", {
          status: 409,
          errors: { code: ["این کد از قبل ثبت شده است"] },
        });
      }
      coupon.code = nextCode;
    }
  }

  const nextType = parsed.data.type ?? coupon.type;
  if (nextType === "private" && (parsed.data.allowedUserIds ?? coupon.allowedUsers).length === 0) {
    return apiError("برای کد تخفیف خصوصی باید حداقل یک کاربر انتخاب شود", {
      status: 422,
      errors: { allowedUserIds: ["برای کد تخفیف خصوصی باید حداقل یک کاربر انتخاب شود"] },
    });
  }

  const { code: _code, allowedUserIds, ...rest } = parsed.data;
  void _code;
  Object.assign(coupon, rest);
  if (allowedUserIds !== undefined) {
    coupon.allowedUsers = allowedUserIds as unknown as typeof coupon.allowedUsers;
  }
  if (nextType === "public") {
    coupon.allowedUsers = [];
  }

  await coupon.save();
  await logActivity({
    actor,
    action: "coupon.updated",
    targetType: "Coupon",
    targetId: coupon.id,
    description: `کد تخفیف «${coupon.code}» ویرایش شد`,
  });
  return apiSuccess({ id: coupon.id }, { message: "کد تخفیف ویرایش شد" });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireApiUser(PERMISSIONS.COUPONS_MANAGE);
  if (guard.response) return guard.response;
  const { user: actor } = guard;

  const { id } = await params;
  await connectToDatabase();

  const coupon = await Coupon.findById(id);
  if (!coupon) {
    return apiError("کد تخفیف یافت نشد", { status: 404 });
  }

  await coupon.deleteOne();
  await logActivity({
    actor,
    action: "coupon.deleted",
    targetType: "Coupon",
    targetId: id,
    description: `کد تخفیف «${coupon.code}» حذف شد`,
  });
  return apiSuccess({ id }, { message: "کد تخفیف حذف شد" });
}
