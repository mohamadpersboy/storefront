import { MobileTopBar } from "@/components/storefront/mobile-top-bar";
import { HeroSlider, type HeroBannerSlide } from "@/components/storefront/hero-slider";
import { connectToDatabase } from "@/lib/db/connect";
import { Banner } from "@/models/Banner";

/**
 * بنرها مستقیماً از DB خوانده می‌شوند (نه یک Fetch HTTP به
 * `/api/v1/banners` از داخل خود Server) — الگوی متداول Next.js
 * برای Server Component هایی که به داده داخلی پروژه نیاز دارند؛
 * از یک Round-trip شبکه اضافه به خودِ سرور جلوگیری می‌کند. همان
 * API عمومی `/api/v1/banners` برای مصرف‌کننده‌های بیرونی/آینده
 * (مثلاً یک اپ موبایل جدا) همچنان در دسترس می‌ماند.
 */
/**
 * `revalidate = 60`: صفحه اصلی به‌صورت ISR هر ۶۰ ثانیه دوباره
 * Generate می‌شود. بدون این، Next.js چون هیچ API پویا (cookies/
 * headers) استفاده نمی‌کند، این صفحه را کاملاً Static در زمان
 * Build می‌سازد — یعنی وقتی ادمین از Dashboard بنر جدید اضافه یا
 * ویرایش کند، بدون Deploy مجدد در Storefront دیده نمی‌شود. ۶۰
 * ثانیه یک تعادل معقول بین Performance (بند ۱۵ Master Workflow)
 * و به‌روز بودن محتوای مدیریت‌شده از Dashboard است.
 */
export const revalidate = 60;

async function getActiveBanners(): Promise<HeroBannerSlide[]> {
  try {
    await connectToDatabase();
    const banners = await Banner.find({ isActive: true })
      .sort({ sortOrder: 1, createdAt: 1 })
      .lean();

    return banners.map((b) => ({
      id: String(b._id),
      title: b.title,
      subtitle: b.subtitle,
      ctaLabel: b.ctaLabel,
      href: b.href,
      imageUrl: b.imageUrl,
      imageBlurDataUrl: b.imageBlurDataUrl,
    }));
  } catch {
    // اگر DB در دسترس نبود، صفحه اصلی نباید خراب شود — فقط
    // Hero Slider نمایش داده نمی‌شود (خودش `banners.length === 0`
    // را مدیریت می‌کند).
    return [];
  }
}

export default async function StorefrontHomePage() {
  const banners = await getActiveBanners();

  return (
    <>
      <MobileTopBar />
      <HeroSlider banners={banners} />
      <main className="flex min-h-[40vh] items-center justify-center p-8">
        <div className="text-center">
          <p className="text-sm text-[var(--sf-ink)]/60">
            فروشگاه اینترنتی تخصصی فرش — در حال ساخت
          </p>
        </div>
      </main>
    </>
  );
}
