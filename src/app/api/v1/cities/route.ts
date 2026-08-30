import type { NextRequest } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db/connect";
import { City } from "@/models/City";
import { apiError, apiSuccess } from "@/lib/utils/api-response";

/**
 * بدون Auth — عمومی، مشابه /api/v1/provinces. همیشه بر اساس Query
 * Param `province` فیلتر می‌شود تا هرگز کل جدول شهرها یک‌جا برنگردد؛
 * طبق سند Audit، Dropdown شهر فقط باید شهرهای همان استان انتخاب‌شده را
 * نشان دهد.
 */
export async function GET(request: NextRequest) {
  const provinceId = request.nextUrl.searchParams.get("province");

  if (!provinceId || !mongoose.isValidObjectId(provinceId)) {
    return apiError("شناسه استان معتبر نیست", {
      status: 422,
      errors: { province: ["شناسه استان معتبر نیست یا ارسال نشده است"] },
    });
  }

  await connectToDatabase();
  const cities = await City.find({ province: provinceId, isActive: true })
    .sort({ name: 1 })
    .lean();

  return apiSuccess(cities.map((c) => ({ id: String(c._id), name: c.name, code: c.code })));
}
