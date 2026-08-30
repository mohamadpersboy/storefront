import * as XLSX from "xlsx";

/**
 * فایل Excel آپلودشده را به آرایه‌ای از Object (هر سطر = یک Object با
 * کلید ستون Header) تبدیل می‌کند. لایه نازک و صرفاً I/O — منطق
 * Validation در `validate-province-city-rows.ts` (تابع خالص) است.
 */
export function parseExcelToRows(buffer: Buffer): Record<string, unknown>[] {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return [];

  const sheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
}
