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
 */
export function FreeShippingBanner({ threshold }: FreeShippingBannerProps) {
  return (
    <section className="px-4 pt-4 sm:px-6">
      <div className="flex items-center gap-3 rounded-2xl bg-[var(--color-primary)] p-4">
        <div className="flex-1">
          <p className="text-sm font-bold text-white sm:text-base">
            ارسال رایگان برای خریدهای بالای {threshold.toLocaleString("fa-IR")} تومان
          </p>
          <p className="mt-0.5 text-xs text-white/80">تحویل سریع به سراسر کشور</p>
        </div>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/15">
          <Truck className="h-5 w-5 text-white" strokeWidth={1.75} aria-hidden="true" />
        </div>
      </div>
    </section>
  );
}
