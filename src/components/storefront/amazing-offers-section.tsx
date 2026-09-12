import { Sparkles } from "lucide-react";
import { SectionHeader } from "@/components/storefront/section-header";
import { AmazingOfferCard, type AmazingOfferCardData } from "@/components/storefront/amazing-offer-card";

/**
 * داده Mock — هنوز API عمومی `GET /api/v1/products/amazing-offers`
 * ساخته نشده (فقط نسخه ادمین‌محور `GET /api/v1/amazing-offers` که
 * نیاز به Permission دارد و برای Storefront عمومی مناسب نیست؛ طبق
 * سند Backend Audit باید یک Route عمومی جدا داشته باشد). طبق بند ۱۳
 * Master Workflow، شکل فیلدها دقیقاً با Modelهای واقعی (`Product`،
 * `Color`، `AmazingOffer`) هماهنگ است تا بعداً فقط منبع داده عوض شود:
 * `variant.basePrice` = `IProductVariant.price`, `discountType`/
 * `discountValue`/`startAt`/`endAt` = فیلدهای مستقیم `AmazingOffer`،
 * `colors[].hexCode` = `IColor.hexCode`.
 *
 * تصاویر فعلاً از نمونه‌های عمومی Cloudinary (دامنه‌ای که در
 * `next.config.ts` از قبل مجاز است) هستند — تصویر واقعی فرش نیست،
 * فقط Placeholder تا API/تصاویر واقعی محصولات وصل شود.
 */
const MOCK_AMAZING_OFFERS: AmazingOfferCardData[] = [
  {
    id: "mock-1",
    product: {
      title: "فرش ۱۲ متری طرح باستان کرم",
      slug: "carpet-bastan-cream",
      imageUrl: "https://res.cloudinary.com/demo/image/upload/samples/ecommerce/leather-bag-gray.jpg",
      imageBlurDataUrl: null,
    },
    colors: [
      { id: "c1", hexCode: "#B33A3A" },
      { id: "c2", hexCode: "#D8C08A" },
      { id: "c3", hexCode: "#2F3B4C" },
    ],
    variant: { basePrice: 48500000 },
    discountType: "percent",
    discountValue: 22,
    startAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    endAt: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "mock-2",
    product: {
      title: "قالیچه دستباف طرح ترنج کرمان",
      slug: "carpet-toranj-kerman",
      imageUrl: "https://res.cloudinary.com/demo/image/upload/samples/ecommerce/analog-classic.jpg",
      imageBlurDataUrl: null,
    },
    colors: [
      { id: "c4", hexCode: "#7A1F1F" },
      { id: "c5", hexCode: "#C9A227" },
    ],
    variant: { basePrice: 32900000 },
    discountType: "percent",
    discountValue: 15,
    startAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    endAt: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "mock-3",
    product: {
      title: "فرش مدرن طرح انتزاعی خاکستری ۶ متری",
      slug: "carpet-modern-abstract-gray",
      imageUrl: "https://res.cloudinary.com/demo/image/upload/samples/ecommerce/shoes.png",
      imageBlurDataUrl: null,
    },
    colors: [{ id: "c6", hexCode: "#4B5563" }],
    variant: { basePrice: 21900000 },
    discountType: "fixed",
    discountValue: 3000000,
    startAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    endAt: new Date(Date.now() + 10 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "mock-4",
    product: {
      title: "فرش ۶ متری گل‌برجسته اصفهان",
      slug: "carpet-golbarjaste-isfahan",
      imageUrl: "https://res.cloudinary.com/demo/image/upload/samples/ecommerce/car.jpg",
      imageBlurDataUrl: null,
    },
    colors: [
      { id: "c7", hexCode: "#8C2F39" },
      { id: "c8", hexCode: "#E8DCC4" },
      { id: "c9", hexCode: "#3B4A3A" },
      { id: "c10", hexCode: "#1F2937" },
    ],
    variant: { basePrice: 56000000 },
    discountType: "percent",
    discountValue: 18,
    startAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    endAt: new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString(),
  },
];

/**
 * بخش «شگفت‌انگیزها» در صفحه اصلی — هدر (بند ۱ ماژول قبلی) + ردیف
 * کارت‌های محصول. آیکون Sparkles همان آیکونی است که Dashboard برای
 * «تخفیف‌های شگفت‌انگیز» استفاده می‌کند تا برندینگ هماهنگ بماند.
 *
 * `seeAllHref` عمداً ست نشده — صفحه/مسیر «مشاهده همه» هنوز طراحی
 * نشده است.
 */
export function AmazingOffersSection() {
  if (MOCK_AMAZING_OFFERS.length === 0) return null;

  return (
    <section className="pt-5">
      <div className="px-4 sm:px-6">
        <SectionHeader
          title="شگفت‌انگیزها"
          icon={Sparkles}
          iconBgClassName="bg-amber-50"
          iconColorClassName="text-amber-600"
        />
      </div>

      <div className="mt-3 flex overflow-x-auto pe-4 [scrollbar-width:none] ps-4 sm:pe-6 sm:ps-6 [&::-webkit-scrollbar]:hidden">
        {MOCK_AMAZING_OFFERS.map((offer) => (
          <AmazingOfferCard key={offer.id} offer={offer} />
        ))}
      </div>
    </section>
  );
}
