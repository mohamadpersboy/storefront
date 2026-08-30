import { connectToDatabase } from "@/lib/db/connect";
import { PERMISSIONS } from "@/lib/constants/rbac";
import { requireApiUser } from "@/lib/auth/api-guard";
import { apiError, apiSuccess } from "@/lib/utils/api-response";
import { parseExcelToRows } from "@/lib/import/parse-excel";
import { validateProvinceCityRows } from "@/lib/import/validate-province-city-rows";
import { importProvincesAndCities } from "@/lib/import/import-provinces-cities";
import { logActivity } from "@/lib/audit/log-activity";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB — یک فایل استان/شهر کل کشور بسیار کوچک‌تر از این است

export async function POST(request: Request) {
  const guard = await requireApiUser(PERMISSIONS.LOCATIONS_MANAGE);
  if (guard.response) return guard.response;
  const { user: actor } = guard;

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");

  if (!file || !(file instanceof File)) {
    return apiError("فایل Excel ارسال نشده است", {
      status: 422,
      errors: { file: ["فایل Excel الزامی است"] },
    });
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return apiError("حجم فایل بیش از حد مجاز است", {
      status: 422,
      errors: { file: ["حداکثر حجم مجاز ۵ مگابایت است"] },
    });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  let rawRows: Record<string, unknown>[];
  try {
    rawRows = parseExcelToRows(buffer);
  } catch {
    return apiError("فایل ارسال‌شده یک Excel معتبر نیست", {
      status: 422,
      errors: { file: ["فایل قابل خواندن نیست؛ فرمت xlsx/xls ارسال کنید"] },
    });
  }

  if (rawRows.length === 0) {
    return apiError("فایل Excel خالی است", {
      status: 422,
      errors: { file: ["هیچ سطر داده‌ای در فایل یافت نشد"] },
    });
  }

  const validated = validateProvinceCityRows(rawRows);

  if (validated.provinces.size === 0) {
    return apiError("هیچ سطر معتبری در فایل یافت نشد", {
      status: 422,
      errors: {
        rows: validated.errors.map((e) => `سطر ${e.row}: ${e.message}`),
      },
    });
  }

  await connectToDatabase();
  const summary = await importProvincesAndCities(validated);

  await logActivity({
    actor,
    action: "locations.imported",
    targetType: "Province",
    description: `Import استان/شهر از Excel: ${summary.provincesUpserted} استان و ${summary.citiesUpserted} شهر ثبت شد (${validated.errors.length} سطر رد شد)`,
  });

  return apiSuccess(
    {
      provincesUpserted: summary.provincesUpserted,
      citiesUpserted: summary.citiesUpserted,
      transactional: summary.transactional,
      rejectedRows: validated.errors,
    },
    { message: "Import با موفقیت انجام شد" },
  );
}
