import { MobileTopBar } from "@/components/storefront/mobile-top-bar";
import { HeroSlider, type HeroBannerSlide } from "@/components/storefront/hero-slider";
import {
  CategoryShortcuts,
  type HomepageCategory,
} from "@/components/storefront/category-shortcuts";
import { FreeShippingBanner } from "@/components/storefront/free-shipping-banner";
import { AmazingOffersSection } from "@/components/storefront/amazing-offers-section";
import { BestSellersSection } from "@/components/storefront/best-sellers-section";
import { LatestProductsSection } from "@/components/storefront/latest-products-section";
import { connectToDatabase } from "@/lib/db/connect";
import { Banner } from "@/models/Banner";
import { Category } from "@/models/Category";
import { getShippingSettings } from "@/models/ShippingSettings";

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

async function getHomepageCategories(): Promise<HomepageCategory[]> {
  try {
    await connectToDatabase();
    const categories = await Category.find({
      parentId: null,
      isActive: true,
      showOnHomepage: true,
    })
      .sort({ sortOrder: 1, createdAt: 1 })
      .lean();

    return categories.map((c) => ({
      id: String(c._id),
      name: c.name,
      slug: c.slug,
      imageUrl: c.imageUrl,
      imageBlurDataUrl: c.imageBlurDataUrl,
    }));
  } catch {
    return [];
  }
}

/**
 * اگر تنظیمات ارسال هنوز در Dashboard مشخص/فعال نشده باشد،
 * `null` برمی‌گردد — طبق درخواست صریح کارفرما («اگه در دشبورد
 * تعیین نکردیم، تو حتماً اضافه کن») این قابلیت به‌صورت Singleton
 * Settings (هم‌الگو با `DiscountSettings`) اضافه شد، اما پیش‌فرض
 * غیرفعال است تا Storefront هرگز یک وعده «ارسال رایگان» ساختگی
 * نشان ندهد.
 */
async function getFreeShippingThreshold(): Promise<number | null> {
  try {
    await connectToDatabase();
    const settings = await getShippingSettings();
    return settings.freeShippingEnabled ? settings.freeShippingThreshold : null;
  } catch {
    return null;
  }
}

export default async function StorefrontHomePage() {
  const [banners, categories, freeShippingThreshold] = await Promise.all([
    getActiveBanners(),
    getHomepageCategories(),
    getFreeShippingThreshold(),
  ]);

  return (
    <>
      <MobileTopBar />
      <HeroSlider banners={banners} />
      <CategoryShortcuts categories={categories} />
      {freeShippingThreshold !== null ? (
        <FreeShippingBanner threshold={freeShippingThreshold} />
      ) : null}
      <AmazingOffersSection />
      <BestSellersSection />
      <LatestProductsSection />
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
