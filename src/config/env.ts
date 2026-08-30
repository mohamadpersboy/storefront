import { z } from "zod";

/**
 * Centralized, validated environment variables.
 *
 * Never read `process.env.X` directly elsewhere in the app — import
 * `env` from this file instead. This guarantees required secrets are
 * present at startup instead of failing deep inside a request handler,
 * and keeps every consumer statically typed.
 */
const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  // Database
  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),

  // Auth
  AUTH_SECRET: z.string().min(32, "AUTH_SECRET must be at least 32 chars"),
  OTP_HASH_SECRET: z
    .string()
    .min(32, "OTP_HASH_SECRET must be at least 32 chars"),

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: z.string().min(1),
  CLOUDINARY_API_KEY: z.string().min(1),
  CLOUDINARY_API_SECRET: z.string().min(1),

  // SMS.ir
  SMS_IR_API_KEY: z.string().min(1),
  SMS_IR_LINE_NUMBER: z.string().min(1),
  SMS_IR_OTP_TEMPLATE_ID: z.string().min(1),

  // Zarinpal (online payment gateway)
  ZARINPAL_MERCHANT_ID: z.string().min(1),
  // "sandbox" hits sandbox.zarinpal.com (no real transaction, safe for
  // testing) — "production" hits payment.zarinpal.com and requires a
  // real Merchant ID issued after Zarinpal's business verification.
  // Switching later is env-only, no code change (see CLAUDE.md).
  ZARINPAL_MODE: z.enum(["sandbox", "production"]).default("sandbox"),

  // App
  //
  // Resolution order:
  // 1. NEXT_PUBLIC_APP_URL, exactly as set — if given without a
  //    protocol (e.g. someone pastes just "cms.vercel.app"), we add
  //    https:// automatically rather than failing the build.
  // 2. VERCEL_URL — Vercel sets this automatically on every
  //    deployment (including each Preview build, which gets its own
  //    unique URL), so Preview builds work without any manual value.
  // 3. http://localhost:3000 — local dev fallback.
  // Neshan Maps (نقشه، انتخاب موقعیت آدرس، Reverse Geocoding)
  //
  // عمداً NEXT_PUBLIC (نه یک متغیر Server-only مثل NESHAN_API_KEY):
  // ویجت نقشه Neshan (بر پایه Leaflet/MapLibre) برای گرفتن Tile ذاتاً
  // در مرورگر اجرا می‌شود و باید مستقیماً به این Key دسترسی داشته
  // باشد؛ Proxy کردن هر درخواست Tile از سرور (مثل الگوی امضای
  // Cloudinary) عملاً غیرقابل قبول است چون هر Pan/Zoom چند ده درخواست
  // موازی می‌سازد و از سرورلس Vercel عبور دادنشان تأخیر و هزینه
  // غیرضروری اضافه می‌کند. مدل امنیتی Neshan برای همین دقیقاً طراحی
  // شده: Key توسط Referrer/Domain در پنل Neshan محدود می‌شود، نه با
  // مخفی نگه‌داشتن آن. همین Key برای Reverse Geocoding (گرفتن آدرس از
  // Lat/Lng) هم مستقیماً از Client فراخوانی می‌شود؛ الگوی رسمی خود
  // Neshan هم همین است. **قبل از استفاده در Production، در پنل Neshan
  // باید Domain واقعی سایت (و دامنه Preview های Vercel در صورت نیاز)
  // به‌عنوان Referrer مجاز ثبت شود.**
  NEXT_PUBLIC_NESHAN_API_KEY: z.string().min(1, "NEXT_PUBLIC_NESHAN_API_KEY is required"),

  NEXT_PUBLIC_APP_URL: z.preprocess((value) => {
    const raw =
      typeof value === "string" && value.trim() !== ""
        ? value.trim()
        : process.env.VERCEL_URL
          ? process.env.VERCEL_URL
          : "http://localhost:3000";
    return /^https?:\/\//.test(raw) ? raw : `https://${raw}`;
  }, z.string().url()),
});

function loadEnv() {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error(
      "❌ Invalid environment variables:",
      parsed.error.flatten().fieldErrors,
    );
    throw new Error("Invalid environment variables. Check .env against .env.example.");
  }

  return parsed.data;
}

export const env = loadEnv();
