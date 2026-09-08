import { MobileBottomBar } from "@/components/storefront/mobile-bottom-bar";

/**
 * Layout ریشه Storefront (کلاس `storefront` برای فعال‌سازی Token های
 * مستقل `--sf-*` در globals.css — جدا از Token های Dashboard).
 *
 * `pb-[76px]` روی موبایل فضای لازم برای Bottom Bar ثابت (ارتفاع
 * ۶۸px + کمی حاشیه برای Safe Area) را رزرو می‌کند تا محتوای صفحه
 * زیر آن پنهان نشود؛ روی `sm` به بالا صفر می‌شود چون Bottom Bar
 * آنجا نمایش داده نمی‌شود.
 */
export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="storefront min-h-screen bg-white">
      <div className="pb-[76px] sm:pb-0">{children}</div>
      <MobileBottomBar />
    </div>
  );
}
