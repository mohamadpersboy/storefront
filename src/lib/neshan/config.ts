import { env } from "@/config/env";

/**
 * تنظیمات مرکزی Neshan — هرجا در پروژه (Map Picker، Reverse Geocoding)
 * به Key یا آدرس پایه API نیاز است، از این‌جا Import شود، نه مستقیم
 * از `process.env`. مطابق تصمیم معماری در `src/config/env.ts`:
 * این Key عمداً Client-side و Public است.
 */
export const NESHAN_API_KEY = env.NEXT_PUBLIC_NESHAN_API_KEY;

/** آدرس پایه سرویس‌های نقشه نشان (Static/Reverse Geocoding و ...) */
export const NESHAN_API_BASE_URL = "https://api.neshan.org";

/** آدرس پایه Tile های نقشه برای رندر با Leaflet/MapLibre */
export const NESHAN_MAP_TILE_BASE_URL = "https://static.neshan.org";
