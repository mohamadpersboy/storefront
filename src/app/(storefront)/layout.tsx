import { MobileBottomBar } from "@/components/storefront/mobile-bottom-bar";

/**
 * Layout ریشه Storefront (کلاس `storefront` برای فعال‌سازی Token های
 * مستقل `--sf-*` در globals.css — جدا از Token های Dashboard).
 *
 * `pb-16` روی موبایل فضای لازم برای Bottom Bar ثابت را رزرو می‌کند تا
 * محتوای صفحه زیر آن پنهان نشود؛ روی `sm` به بالا صفر می‌شود چون
 * Bottom Bar آنجا نمایش داده نمی‌شود.
 */
export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="storefront min-h-screen bg-white">
      <div className="pb-16 sm:pb-0">{children}</div>
      <MobileBottomBar />
    </div>
  );
}
