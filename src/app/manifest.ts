import type { MetadataRoute } from "next";

/**
 * Web App Manifest — فایل ویژه Next.js App Router.
 *
 * قرار گرفتن این فایل در `src/app/manifest.ts` باعث می‌شود Next.js
 * به‌صورت خودکار آن را در مسیر `/manifest.webmanifest` سرو کند و
 * تگ `<link rel="manifest">` را در `<head>` تزریق کند — نیازی به
 * افزودن دستی لینک در `layout.tsx` نیست.
 *
 * `scope`/`start_url` روی کل سایت (`/`) تنظیم شده‌اند، پس این
 * Manifest برای هر دو بخش Storefront و Dashboard معتبر است؛ اما
 * بنر پیشنهاد نصب (`InstallPrompt`) فقط داخل Storefront رندر
 * می‌شود (نگاه کنید `install-prompt.tsx`) چون کاربر هدف نصب،
 * مشتری است نه ادمین.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "فرش سقطچی | فروشگاه تخصصی فرش",
    short_name: "فرش سقطچی",
    description:
      "فروشگاه اینترنتی تخصصی فرش ماشینی، موکت، تابلو فرش، پادری و محصولات مرتبط.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    dir: "rtl",
    lang: "fa",
    background_color: "#f3f4f6",
    theme_color: "#4f46e5",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
