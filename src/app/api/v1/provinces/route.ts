import { connectToDatabase } from "@/lib/db/connect";
import { Province } from "@/models/Province";
import { apiSuccess } from "@/lib/utils/api-response";

/**
 * بدون Auth — مشابه social-links، این یک API عمومی برای Dropdown
 * انتخاب استان در فرم‌های Address است و هم Dashboard هم Storefront
 * آینده به آن نیاز دارند. داده حساسیتی ندارد.
 */
export async function GET() {
  await connectToDatabase();
  const provinces = await Province.find({ isActive: true }).sort({ name: 1 }).lean();

  return apiSuccess(
    provinces.map((p) => ({ id: String(p._id), name: p.name, code: p.code })),
  );
}
