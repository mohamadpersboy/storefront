import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
