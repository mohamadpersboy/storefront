import type { NextRequest } from "next/server";

/** حداکثر اندازه Body فرم Callback؛ جلوگیری از مصرف حافظه با ورودی بزرگ. */
const MAX_BODY_BYTES = 16 * 1024;
const MAX_VALUE_LENGTH = 512;

/**
 * پارامترهای Callback سپهر را (POST فرم یا GET) به یک شیء ساده تبدیل می‌کند.
 * همه مقدارها رشته‌ی کوتاه‌شده‌اند؛ هیچ مقداری قابل اعتماد نیست و فقط
 * Adapter پس از Advice آن را می‌پذیرد.
 */
export async function readCallbackData(request: NextRequest): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  const put = (key: string, value: unknown) => {
    if (typeof value === "string") out[key.toLowerCase()] = value.slice(0, MAX_VALUE_LENGTH);
  };

  request.nextUrl.searchParams.forEach((value, key) => put(key, value));

  if (request.method === "POST") {
    const length = Number(request.headers.get("content-length") ?? 0);
    if (length <= MAX_BODY_BYTES) {
      const form = await request.formData().catch(() => null);
      form?.forEach((value, key) => put(key, value));
    }
  }
  return out;
}
