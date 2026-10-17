import type { Metadata, Viewport } from "next";
import { iranYekanX } from "@/fonts";
import { RegisterServiceWorker } from "@/components/pwa/register-service-worker";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "فرش سقطچی | فروشگاه تخصصی فرش",
    template: "%s | فرش سقطچی",
  },
  description:
    "فروشگاه اینترنتی تخصصی فرش ماشینی، موکت، تابلو فرش، پادری و محصولات مرتبط.",
  // Manifest واقعی از `src/app/manifest.ts` می‌آید (فایل ویژه
  // Next.js) — به‌صورت خودکار در <head> لینک می‌شود، نیازی به فیلد
  // `manifest` دستی اینجا نیست.
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "فرش سقطچی",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icons/apple-touch-icon.png",
  },
};

// `themeColor` اینجا روی کل سایت (Storefront + Dashboard) اعمال
// می‌شود؛ Layout های تودرتو (مثل `(storefront)/layout.tsx`) فقط
// فیلدهای خودشان (مثلاً `maximumScale`) را Override می‌کنند، بقیه
// از همین‌جا به ارث می‌رسد.
export const viewport: Viewport = {
  themeColor: "#4f46e5",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" className={iranYekanX.variable}>
      <body className="antialiased">
        {children}
        <RegisterServiceWorker />
      </body>
    </html>
  );
}
