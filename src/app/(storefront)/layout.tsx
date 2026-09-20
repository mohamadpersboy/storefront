import type { Viewport } from "next";
import { StorefrontChrome } from "@/components/storefront/storefront-chrome";

/**
 * Layout ریشه Storefront (کلاس `storefront` برای فعال‌سازی Token های
 * مستقل `--sf-*` در globals.css — جدا از Token های Dashboard).
 *
 * `MobileBottomBar` سراسری + فضای `pb-[76px]` رزروشده برایش، از
 * طریق `StorefrontChrome` رندر می‌شوند — که بر اساس مسیر فعلی
 * تصمیم می‌گیرد نمایشش بدهد یا نه (صفحه محصول نوار پایین چسبان
 * اختصاصی خودش را دارد، نگاه کنید `ProductAddToCartBar`). این
 * تصمیم به `usePathname` نیاز دارد، پس در یک Client Component جدا
 * است، نه مستقیم این‌جا (این Layout خودش Server Component می‌ماند).
 *
 * `bg-gray-100`: بک‌گراند کل صفحات Storefront خاکستری کم‌رنگ است
 * (طبق درخواست کارفرما) — نه سفید. کارت‌ها/بخش‌های سفید (مثل خود
 * Top/Bottom Bar) روی همین پس‌زمینه Contrast خودشان را می‌گیرند.
 * این تغییر فقط داخل `.storefront` است و روی Dashboard اثر ندارد.
 *
 * `min-h-dvh` (نه `min-h-screen`/`100vh`): موبایل هنگام Scroll نوار
 * آدرس مرورگر را جمع/باز می‌کند و ارتفاع واقعی Viewport تغییر
 * می‌کند؛ `dvh` این تغییر را دنبال می‌کند و به همراه Selector
 * `body:has(> .storefront)` در globals.css (که پس‌زمینهٔ خودِ
 * <body> را هم با همین خاکستری هماهنگ می‌کند) از فلاش کوتاه نوار
 * سفید در پایین صفحه هنگام Scroll جلوگیری می‌کند.
 *
 * `viewport` این Layout — نه Layout ریشه — override می‌شود تا Zoom
 * روی موبایل فقط در Storefront غیرفعال شود (طبق درخواست کارفرما:
 * حس یک اپ موبایل، نه یک صفحه وب معمولی) و Dashboard (که برای
 * Accessibility بهتر است Zoom را اجازه بدهد) دست‌نخورده بماند.
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="storefront min-h-dvh bg-gray-100">
      <StorefrontChrome>{children}</StorefrontChrome>
    </div>
  );
}
