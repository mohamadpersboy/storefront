import { Sparkles } from "lucide-react";
import { SectionHeader } from "@/components/storefront/section-header";
import { ProductCard, type ProductCardData } from "@/components/storefront/product-card";
import { computeAmazingOfferPrice } from "@/lib/utils/amazing-offer";

/**
 * داده Mock — هنوز API عمومی `GET /api/v1/products/amazing-offers`
 * ساخته نشده (فقط نسخه ادمین‌محور `GET /api/v1/amazing-offers` که
 * نیاز به Permission دارد و برای Storefront عمومی مناسب نیست؛ طبق
 * سند Backend Audit باید یک Route عمومی جدا داشته باشد). `finalPrice`
 * دقیقاً همان چیزی است که Route فعلی هم Serialize می‌کند (محاسبه‌شده
 * از `discountType`/`discountValue` واقعی `AmazingOffer` — همان
 * منطق `computeAmazingOfferPrice`)، پس بعداً فقط منبع داده عوض
 * می‌شود، نه شکل خروجی.
 *
 * تصاویر فعلاً از نمونه‌های عمومی Cloudinary (دامنه‌ای که در
 * `next.config.ts` از قبل مجاز است) هستند — تصویر واقعی فرش نیست،
 * فقط Placeholder تا API/تصاویر واقعی محصولات وصل شود. عمداً فقط
 * از دو نمونه (`leather-bag-gray`, `analog-classic`) به‌صورت
 * تکراری استفاده شده: چند نمونهٔ دیگر Cloudinary حاشیهٔ خالی زیادی
 * داخل خود عکس دارند و محصول را کوچک‌تر از بقیه نشان می‌دهند.
 */
const RAW_OFFERS = [
  {
    id: "mock-1",
    title: "فرش ۱۲ متری طرح باستان کرم",
    slug: "carpet-bastan-cream",
    image: "leather-bag-gray.jpg",
    colors: ["#B33A3A", "#D8C08A", "#2F3B4C"],
    basePrice: 48500000,
    discountType: "percent" as const,
    discountValue: 22,
    startInHours: -2,
    endInHours: 6,
  },
  {
    id: "mock-2",
    title: "قالیچه دستباف طرح ترنج کرمان",
    slug: "carpet-toranj-kerman",
    image: "analog-classic.jpg",
    colors: ["#7A1F1F", "#C9A227"],
    basePrice: 32900000,
    discountType: "percent" as const,
    discountValue: 15,
    startInHours: -1,
    endInHours: 3,
  },
  {
    id: "mock-3",
    title: "فرش مدرن طرح انتزاعی خاکستری ۶ متری",
    slug: "carpet-modern-abstract-gray",
    image: "leather-bag-gray.jpg",
    colors: ["#4B5563"],
    basePrice: 21900000,
    discountType: "fixed" as const,
    discountValue: 3000000,
    startInHours: -4,
    endInHours: 10,
  },
  {
    id: "mock-4",
    title: "فرش ۶ متری گل‌برجسته اصفهان",
    slug: "carpet-golbarjaste-isfahan",
    image: "analog-classic.jpg",
    colors: ["#8C2F39", "#E8DCC4", "#3B4A3A", "#1F2937"],
    basePrice: 56000000,
    discountType: "percent" as const,
    discountValue: 18,
    startInHours: -3,
    endInHours: 1,
  },
];

const MOCK_AMAZING_OFFERS: ProductCardData[] = RAW_OFFERS.map((raw) => ({
  id: raw.id,
  product: {
    title: raw.title,
    slug: raw.slug,
    imageUrl: `https://res.cloudinary.com/demo/image/upload/samples/ecommerce/${raw.image}`,
    imageBlurDataUrl: null,
  },
  colors: raw.colors.map((hexCode, index) => ({ id: `${raw.id}-c${index}`, hexCode })),
  basePrice: raw.basePrice,
  finalPrice: computeAmazingOfferPrice(raw.basePrice, raw.discountType, raw.discountValue),
  amazingOffer: {
    startAt: new Date(Date.now() + raw.startInHours * 60 * 60 * 1000).toISOString(),
    endAt: new Date(Date.now() + raw.endInHours * 60 * 60 * 1000).toISOString(),
  },
}));

/**
 * بخش «شگفت‌انگیزها» در صفحه اصلی — هدر + ردیف `ProductCard`
 * (کامپوننت مشترک بین همهٔ ردیف‌های محصول صفحه اصلی). آیکون
 * Sparkles همان آیکونی است که Dashboard برای «تخفیف‌های
 * شگفت‌انگیز» استفاده می‌کند تا برندینگ هماهنگ بماند؛ رنگ برند این
 * بخش (آیکون + عنوان + «مشاهده بیشتر») قرمز آلبالویی است.
 *
 * `seeAllHref` به‌صورت موقت به همان مسیر آیندهٔ API عمومی اشاره
 * می‌کند؛ صفحهٔ مقصد («مشاهده بیشتر») هنوز طراحی نشده است.
 */
export function AmazingOffersSection() {
  if (MOCK_AMAZING_OFFERS.length === 0) return null;

  return (
    <section className="pt-8">
      <div className="px-4 sm:px-6">
        <SectionHeader
          title="شگفت‌انگیزها"
          icon={Sparkles}
          iconBgClassName="bg-[var(--sf-cherry-soft)]"
          iconColorClassName="text-[var(--sf-cherry)]"
          titleColorClassName="text-[var(--sf-cherry)]"
          seeAllHref="/products/amazing-offers"
          seeAllLabel="مشاهده بیشتر"
          seeAllClassName="text-[var(--sf-cherry)] text-xs"
        />
      </div>

      <div className="mt-3 flex overflow-x-auto pe-4 [scrollbar-width:none] ps-4 sm:pe-6 sm:ps-6 [&::-webkit-scrollbar]:hidden">
        {MOCK_AMAZING_OFFERS.map((item) => (
          <ProductCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}
