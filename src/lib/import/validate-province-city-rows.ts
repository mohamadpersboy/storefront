import { z } from "zod";

const provinceCityRowSchema = z.object({
  province: z.string().trim().min(1, "نام استان الزامی است"),
  provinceCode: z.string().trim().min(1, "کد استان الزامی است"),
  city: z.string().trim().min(1, "نام شهر الزامی است"),
  cityCode: z.string().trim().min(1, "کد شهر الزامی است"),
});

export interface RowError {
  row: number;
  message: string;
}

export interface ValidatedImportData {
  /** کد استان → نام استان */
  provinces: Map<string, string>;
  /** کد شهر → { نام شهر، کد استان مربوطه } */
  cities: Map<string, { name: string; provinceCode: string }>;
  errors: RowError[];
}

/**
 * تابع خالص (بدون DB/فایل): سطرهای خام حاصل از Parse شدن Excel را
 * Validate می‌کند و به دو نگاشت مستقل استان/شهر تبدیل می‌کند تا Import
 * واقعی (`import-provinces-cities.ts`) فقط روی داده تمیز کار کند.
 * قابل تست کامل بدون راه‌اندازی MongoDB یا ساخت فایل Excel واقعی —
 * همان الگوی `validate-coupon.ts`.
 *
 * شماره سطر گزارش‌شده مطابق شماره واقعی در فایل Excel است (سطر ۱ =
 * Header، داده از سطر ۲ شروع می‌شود).
 */
export function validateProvinceCityRows(
  rawRows: Record<string, unknown>[],
): ValidatedImportData {
  const provinces = new Map<string, string>();
  const cities = new Map<string, { name: string; provinceCode: string }>();
  const errors: RowError[] = [];

  rawRows.forEach((raw, index) => {
    const rowNumber = index + 2;
    const parsed = provinceCityRowSchema.safeParse({
      province: raw["Province"],
      provinceCode: String(raw["Province Code"] ?? "").trim(),
      city: raw["City"],
      cityCode: String(raw["City Code"] ?? "").trim(),
    });

    if (!parsed.success) {
      errors.push({
        row: rowNumber,
        message: parsed.error.issues.map((issue) => issue.message).join("، "),
      });
      return;
    }

    const { province, provinceCode, city, cityCode } = parsed.data;

    const existingProvinceName = provinces.get(provinceCode);
    if (existingProvinceName && existingProvinceName !== province) {
      errors.push({
        row: rowNumber,
        message: `کد استان «${provinceCode}» قبلاً با نام «${existingProvinceName}» در این فایل ثبت شده؛ این سطر نام متفاوت «${province}» دارد`,
      });
      return;
    }
    provinces.set(provinceCode, province);

    const existingCity = cities.get(cityCode);
    if (existingCity) {
      errors.push({
        row: rowNumber,
        message: `کد شهر «${cityCode}» در این فایل تکراری است (قبلاً برای «${existingCity.name}» استفاده شده)`,
      });
      return;
    }
    cities.set(cityCode, { name: city, provinceCode });
  });

  return { provinces, cities, errors };
}
