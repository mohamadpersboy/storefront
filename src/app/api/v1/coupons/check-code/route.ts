import type { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db/connect";
import { Coupon } from "@/models/Coupon";
import { PERMISSIONS } from "@/lib/constants/rbac";
import { requireApiUser } from "@/lib/auth/api-guard";
import { apiError, apiSuccess } from "@/lib/utils/api-response";

export async function GET(request: NextRequest) {
  const guard = await requireApiUser(PERMISSIONS.COUPONS_MANAGE);
  if (guard.response) return guard.response;

  const code = request.nextUrl.searchParams.get("code")?.trim().toUpperCase();
  if (!code) {
    return apiError("کد الزامی است", { status: 422 });
  }

  await connectToDatabase();
  const existing = await Coupon.exists({ code });

  return apiSuccess({ code, available: !existing });
}
