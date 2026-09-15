import { MobileTopBar } from "@/components/storefront/mobile-top-bar";
import { HeroSlider, type HeroBannerSlide } from "@/components/storefront/hero-slider";
import {
  CategoryShortcuts,
  type HomepageCategory,
} from "@/components/storefront/category-shortcuts";
import { FreeShippingBanner } from "@/components/storefront/free-shipping-banner";
import { BrandsSection, type HomepageBrand } from "@/components/storefront/brands-section";
import { AmazingOffersSection } from "@/components/storefront/amazing-offers-section";
import { BestSellersSection } from "@/components/storefront/best-sellers-section";
import { LatestProductsSection } from "@/components/storefront/latest-products-section";
import type { ProductCardData } from "@/components/storefront/product-card";
import { FeaturesRow } from "@/components/storefront/features-row";
import { AboutUsCard } from "@/components/storefront/about-us-card";
import { Footer, type FooterSocialLink } from "@/components/storefront/footer";
import { connectToDatabase } from "@/lib/db/connect";
import { Banner } from "@/models/Banner";
import { Category } from "@/models/Category";
import { Brand } from "@/models/Brand";
import { getShippingSettings } from "@/models/ShippingSettings";
import { getSocialLinks } from "@/models/SocialLinks";
import { getAboutUs } from "@/models/AboutUs";
import {
  getAmazingOfferProductCards,
  getBestSellerProductCards,
  getLatestProductCards,
} from "@/lib/storefront/homepage-products";

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

async function getHomepageBrands(): Promise<HomepageBrand[]> {
  try {
    await connectToDatabase();
    const brands = await Brand.find({
      isActive: true,
      showOnHomepage: true,
    })
      .sort({ sortOrder: 1, createdAt: 1 })
      .lean();

    return brands.map((b) => ({
      id: String(b._id),
      name: b.name,
      slug: b.slug,
      imageUrl: b.imageUrl,
      imageBlurDataUrl: b.imageBlurDataUrl,
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

async function getActiveSocialLinks(): Promise<FooterSocialLink[]> {
  try {
    await connectToDatabase();
    const settings = await getSocialLinks();
    return settings.links
      .filter((link) => link.isActive && link.url.trim().length > 0)
      .map((link) => ({ platform: link.platform, url: link.url }));
  } catch {
    return [];
  }
}

async function getAboutUsContent(): Promise<{ title: string; content: string }> {
  try {
    await connectToDatabase();
    const about = await getAboutUs();
    return { title: about.title, content: about.content };
  } catch {
    return { title: "", content: "" };
  }
}

/**
 * سه ردیف محصول صفحه اصلی (شگفت‌انگیزها/پرفروش‌ترین‌ها/جدیدترین‌ها)
 * دیگر Mock نیستند — منطق واقعی Query در
 * `src/lib/storefront/homepage-products.ts` است؛ اینجا فقط طبق
 * همان الگوی بقیهٔ Getterهای همین فایل با `try/catch` پوشانده
 * می‌شوند تا نبود/خرابی موقت DB باعث از کار افتادن کل صفحهٔ اصلی
 * نشود — فقط همان ردیف خالی نمایش داده می‌شود (خودش `items.length
 * === 0` را مدیریت می‌کند).
 */
async function getAmazingOffersSafe(): Promise<ProductCardData[]> {
  try {
    await connectToDatabase();
    return await getAmazingOfferProductCards();
  } catch {
    return [];
  }
}

async function getBestSellersSafe(): Promise<ProductCardData[]> {
  try {
    await connectToDatabase();
    return await getBestSellerProductCards();
  } catch {
    return [];
  }
}

async function getLatestProductsSafe(): Promise<ProductCardData[]> {
  try {
    await connectToDatabase();
    return await getLatestProductCards();
  } catch {
    return [];
  }
}

export default async function StorefrontHomePage() {
  const [
    banners,
    categories,
    brands,
    freeShippingThreshold,
    socialLinks,
    aboutUs,
    amazingOffers,
    bestSellers,
    latestProducts,
  ] = await Promise.all([
    getActiveBanners(),
    getHomepageCategories(),
    getHomepageBrands(),
    getFreeShippingThreshold(),
    getActiveSocialLinks(),
    getAboutUsContent(),
    getAmazingOffersSafe(),
    getBestSellersSafe(),
    getLatestProductsSafe(),
  ]);

  return (
    <>
      <MobileTopBar />
      <HeroSlider banners={banners} />
      <CategoryShortcuts categories={categories} />
      {freeShippingThreshold !== null ? (
        <FreeShippingBanner threshold={freeShippingThreshold} />
      ) : null}
      <BrandsSection brands={brands} />
      <AmazingOffersSection items={amazingOffers} />
      <BestSellersSection items={bestSellers} />
      <LatestProductsSection items={latestProducts} />
      <FeaturesRow />
      <AboutUsCard title={aboutUs.title} content={aboutUs.content} />
      <Footer socialLinks={socialLinks} />
    </>
  );
}
