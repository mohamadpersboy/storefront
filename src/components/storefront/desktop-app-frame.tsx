/**
 * قاب موبایل برای دسکتاپ (≥۱۰۲۴px) — فقط ارائه (Presentation).
 *
 * همان Storefront واقعی یک‌بار رندر می‌شود (بدون iframe، بدون مسیر یا
 * رندر تکراری). استایل‌ها در globals.css (`.sf-*`) هستند؛ زیر ۱۰۲۴px
 * همهٔ لایه‌ها `display: contents` می‌شوند و چیزی تغییر نمی‌کند.
 *
 * ترتیب DOM: قاب اول، پیام کناری بعد از آن (برای SEO و Screen Reader).
 * `#sf-overlay-root` داخل قاب است تا Sheet ها و Modal ها داخل قاب بمانند.
 */
export function DesktopAppFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="sf-stage">
      <div
        className="sf-frame"
        role="region"
        aria-label="نمای موبایل فروشگاه"
      >
        <div className="sf-frame__scroller" data-sf-scroller>
          {children}
        </div>
        <div id="sf-overlay-root" className="sf-overlay-root" />
      </div>
      <aside className="sf-stage__aside" data-nosnippet>
        <h2 className="text-2xl font-bold">فرش سقطچی</h2>
        <p className="mt-2 text-base font-semibold">وب‌اپلیکیشن موبایل‌محور</p>
        <p className="mt-3 text-sm leading-7 text-gray-600">
          تجربه کامل فروشگاه را همین‌جا در قاب موبایل ببینید.
        </p>
      </aside>
    </div>
  );
}
