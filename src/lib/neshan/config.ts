// ⚠️ عمداً از env.ts (`@/config/env`) وارد نمی‌شود، با اینکه هر دو
// همین یک Key را نگه می‌دارند. این فایل توسط کامپوننت‌های Client
// (`"use client"`، مثل NeshanMapPicker) مصرف می‌شود؛ اگر از `env.ts`
// Import می‌کردیم، کل Schema اعتبارسنجی Environment Variableهای
// سمت سرور (شامل Secretهای حساس مثل MONGODB_URI/AUTH_SECRET) داخل
// باندل جاوااسکریپت مرورگر قرار می‌گرفت و در آن‌جا اجرا می‌شد — و چون
// در مرورگر `process.env` یک Object واقعی نیست (Next.js فقط ارجاع‌های
// *مستقیم و ادبی* مثل `process.env.NEXT_PUBLIC_X` را در Build با
// مقدار واقعی جایگزین می‌کند، نه یک خواندن کلی از `process.env`)،
// اعتبارسنجی همیشه با «هر فیلد undefined است» شکست می‌خورد — این
// دقیقاً همان باگی بود که باعث خطای «Invalid environment variables»
// در صفحه سفارش جدید می‌شد، نه یک تنظیم اشتباه در Vercel.
export const NESHAN_API_KEY = process.env.NEXT_PUBLIC_NESHAN_API_KEY ?? "";

/** آدرس پایه سرویس‌های نقشه نشان (Static/Reverse Geocoding و ...) */
export const NESHAN_API_BASE_URL = "https://api.neshan.org";

/** آدرس پایه Tile های نقشه برای رندر با Leaflet/MapLibre */
export const NESHAN_MAP_TILE_BASE_URL = "https://static.neshan.org";
