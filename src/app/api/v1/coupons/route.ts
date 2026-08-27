import type { NextRequest } from "next/server";
import type { Types } from "mongoose";
import { connectToDatabase } from "@/lib/db/connect";
import { Coupon, type ICoupon } from "@/models/Coupon";
import { PERMISSIONS } from "@/lib/constants/rbac";
import { requireApiUser } from "@/lib/auth/api-guard";
import { apiError, apiSuccess } from "@/lib/utils/api-response";
import { createCouponSchema, couponsListQuerySchema } from "@/lib/validations/coupons";
import { logActivity } from "@/lib/audit/log-activity";

type LeanCoupon = ICoupon & { _id: Types.ObjectId };

function serialize(c: LeanCoupon) {
  const now = new Date();
  const isExpired = now > c.expiresAt;
  return {
    id: String(c._id),
    code: c.code,
    discountPercentage: c.discountPercentage,
    maxDiscountAmount: c.maxDiscountAmount,
    minOrderAmount: c.minOrderAmount,
    startsAt: c.startsAt,
    expiresAt: c.expiresAt,
    status: c.status,
    type: c.type,
    allowedUsersCount: c.allowedUsers.length,
    usageLimit: c.usageLimit,
    usedCount: c.usedCount,
    perUserLimit: c.perUserLimit,
    createdAt: c.createdAt,
    isExpired,
  };
}

export async function GET(request: NextRequest) {
  const guard = await requireApiUser(PERMISSIONS.COUPONS_READ);
  if (guard.response) return guard.response;

  const { searchParams } = request.nextUrl;
  const parsed = couponsListQuerySchema.safeParse({
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
    const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.code = { $regex: escaped, $options: "i" };
  }

  const result = await Coupon.paginate(filter, {
    page,
    limit,
    sort: { createdAt: -1 },
    lean: true,
  });

  return apiSuccess(result.docs.map((doc) => serialize(doc as LeanCoupon)), {
    pagination: {
      totalDocs: result.totalDocs,
      totalPages: result.totalPages,
      page: result.page ?? page,
      limit: result.limit,
      hasNextPage: result.hasNextPage,
      hasPrevPage: result.hasPrevPage,
    },
  });
}

export async function POST(request: Request) {
  const guard = await requireApiUser(PERMISSIONS.COUPONS_MANAGE);
  if (guard.response) return guard.response;
  const { user: actor } = guard;

  const json = await request.json().catch(() => null);
  const parsed = createCouponSchema.safeParse(json);
  if (!parsed.success) {
    return apiError("اطلاعات ارسالی معتبر نیست", {
      status: 422,
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  await connectToDatabase();

  const code = parsed.data.code.toUpperCase();
  const existing = await Coupon.findOne({ code });
  if (existing) {
    return apiError("این کد از قبل ثبت شده است", {
      status: 409,
      errors: { code: ["این کد از قبل ثبت شده است"] },
    });
  }

  const coupon = await Coupon.create({
    ...parsed.data,
    code,
    maxDiscountAmount: parsed.data.maxDiscountAmount ?? null,
    startsAt: parsed.data.startsAt ?? null,
    usageLimit: parsed.data.usageLimit ?? null,
    perUserLimit: parsed.data.perUserLimit ?? null,
    allowedUsers: parsed.data.type === "private" ? parsed.data.allowedUserIds : [],
  });

  await logActivity({
    actor,
    action: "coupon.created",
    targetType: "Coupon",
    targetId: coupon.id,
    description: `کد تخفیف «${coupon.code}» ایجاد شد (${coupon.discountPercentage}٪)`,
  });

  return apiSuccess({ id: coupon.id }, { message: "کد تخفیف ایجاد شد", status: 201 });
}
