import type { NextConfig } from "next";

// Docker Phase 1: خروجی Standalone فقط وقتی فعال می‌شود که Build داخل
// Docker با DOCKER_BUILD=1 اجرا شود. Build فعلی Vercel (بدون این متغیر)
// دقیقاً مثل قبل می‌ماند.
const isDockerBuild = process.env.DOCKER_BUILD === "1";

const nextConfig: NextConfig = {
  ...(isDockerBuild ? { output: "standalone" as const } : {}),
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
  async headers() {
    return [
      {
        // بدون این هدر، بعضی CDN/مرورگرها ممکن است sw.js را برای
        // مدتی Cache کنند و نسخه جدید Service Worker دیر اعمال شود.
        source: "/sw.js",
        headers: [{ key: "Cache-Control", value: "no-cache" }],
      },
    ];
  },
};

export default nextConfig;
