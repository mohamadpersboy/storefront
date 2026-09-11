import { Truck } from "lucide-react";

export type FreeShippingBannerProps = {
  threshold: number;
};

/**
 * بنر ارسال رایگان زیر ردیف دسته‌بندی‌های صفحه اصلی (رفرنس کارفرما:
 * اپ میوه/سبزیجات). فقط وقتی رندر می‌شود که کارفرما این قابلیت را
 * صریحاً در Dashboard → تنظیمات → ارسال فعال کرده باشد (نگاه کنید
 * `page.tsx` — `shippingSettings.freeShippingEnabled`)؛ تا وقتی
 * فعال نشده، هیچ ادعای «ارسال رایگان» ای نمایش داده نمی‌شود.
 *
 * رنگ عمداً Indigo برند (نه سبز رفرنس) برای هماهنگی با بقیه
 * Storefront — اگر رنگ دیگری مدنظر است بگو عوضش کنم.
 *
 * آیکون عمداً اول در DOM آمده (نه دوم): چون کل صفحه RTL است، اولین
 * فرزند در یک ردیف Flex در سمت راست قرار می‌گیرد — یعنی آیکون
 * راست، متن چپ (طبق بازخورد صریح کارفرما). فونت‌ها هم کوچک‌تر و
 * Padding کمتر شد تا ارتفاع بنر زیاد نشود.
 */
export function FreeShippingBanner({ threshold }: FreeShippingBannerProps) {
  return (
    <section className="px-4 pt-4 sm:px-6">
      <div className="flex items-center gap-3 rounded-2xl bg-[var(--color-primary)] p-3.5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15">
          <Truck className="h-4.5 w-4.5 text-white" strokeWidth={1.75} aria-hidden="true" />
        </div>
        <div className="flex-1">
          <p className="text-xs font-bold text-white sm:text-sm">
            ارسال رایگان برای خریدهای بالای {threshold.toLocaleString("fa-IR")} تومان
          </p>
          <p className="mt-0.5 text-[11px] text-white/80">تحویل سریع به سراسر کشور</p>
        </div>
      </div>
    </section>
  );
}
