import type { Viewport } from "next";
import { MobileBottomBar } from "@/components/storefront/mobile-bottom-bar";

/**
 * Layout ریشه Storefront (کلاس `storefront` برای فعال‌سازی Token های
 * مستقل `--sf-*` در globals.css — جدا از Token های Dashboard).
 *
 * `pb-[76px]` روی موبایل فضای لازم برای Bottom Bar ثابت (ارتفاع
 * ۶۸px + کمی حاشیه برای Safe Area) را رزرو می‌کند تا محتوای صفحه
 * زیر آن پنهان نشود؛ روی `sm` به بالا صفر می‌شود چون Bottom Bar
 * آنجا نمایش داده نمی‌شود.
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
      <div className="pb-[76px] sm:pb-0">{children}</div>
      <MobileBottomBar />
    </div>
  );
}
