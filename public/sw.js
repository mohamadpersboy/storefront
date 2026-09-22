/**
 * Service Worker حداقلی فرش سقطچی.
 *
 * هدف اصلی این فایل فقط "قابلیت نصب" (Installability) سایت به‌عنوان
 * PWA است، نه یک لایه Offline کامل — چون داده‌های سایت (موجودی،
 * قیمت، سبد خرید) باید همیشه واقعی و به‌روز باشند و Cache کردن
 * پاسخ API می‌تواند باعث نمایش قیمت/موجودی قدیمی شود (طبق اصل
 * پروژه: هرگز به داده Cache/Client به‌جای Backend واقعی اعتماد نکن).
 *
 * استراتژی:
 * - Asset های استاتیک واقعاً بدون تغییر (آیکون‌ها، فونت‌ها، فایل‌های
 *   built‌شده Next.js زیر `/_next/static/`) با Cache-First سرو
 *   می‌شوند — این‌ها Hash-based هستند، پس هیچ‌وقت Stale نمی‌شوند.
 * - هر درخواست دیگر (صفحات HTML، API) مستقیم و بدون دخالت به شبکه
 *   می‌رود (Network-Only) — یعنی هیچ داده‌ای Cache/Stale نشان داده
 *   نمی‌شود. اگر در آینده نیاز به یک صفحه واقعی Offline Fallback
 *   بود، باید آگاهانه و با تأیید کارفرما اضافه شود.
 */

const STATIC_CACHE = "sf-static-v1";
const STATIC_PATH_PREFIXES = ["/_next/static/", "/icons/", "/fonts/"];

self.addEventListener("install", () => {
  // بلافاصله SW جدید فعال شود، بدون منتظر ماندن برای بسته‌شدن Tabهای قدیمی.
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== STATIC_CACHE)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) {
    return;
  }

  const isStaticAsset = STATIC_PATH_PREFIXES.some((prefix) =>
    url.pathname.startsWith(prefix),
  );

  if (!isStaticAsset) {
    // Network-Only برای همه‌چیز دیگر (صفحات، API) — عمداً هیچ Fallback
    // به Cache نداریم تا داده Stale هرگز نمایش داده نشود.
    return;
  }

  event.respondWith(
    caches.open(STATIC_CACHE).then(async (cache) => {
      const cached = await cache.match(request);
      if (cached) {
        return cached;
      }
      const response = await fetch(request);
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    }),
  );
});
