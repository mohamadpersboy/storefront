import { TrendingUp } from "lucide-react";
import { SectionHeader } from "@/components/storefront/section-header";
import { ProductCard, type ProductCardData } from "@/components/storefront/product-card";

/**
 * داده Mock — هنوز API عمومی `GET /api/v1/products/best-selling`
 * ساخته نشده (طبق سند Backend Audit، معیار Best Selling باید بر
 * اساس Orderهای واقعی محاسبه شود، نه Mock). هیچ‌کدام از این آیتم‌ها
 * `amazingOffer` ندارند — سناریوی «هم‌زمان محصول جدید و شگفت‌انگیز»
 * قبلاً در `LatestProductsSection` نشان داده شده، تکرارش لازم نیست.
 */
const MOCK_BEST_SELLERS: ProductCardData[] = [
  {
    id: "mock-b1",
    product: {
      title: "فرش ۹ متری طرح لچک‌ترنج مشهد",
      slug: "carpet-lachak-toranj-mashhad",
      imageUrl: "https://res.cloudinary.com/demo/image/upload/samples/ecommerce/leather-bag-gray.jpg",
      imageBlurDataUrl: null,
    },
    colors: [
      { id: "b1-c1", hexCode: "#7A1F1F" },
      { id: "b1-c2", hexCode: "#E8DCC4" },
    ],
    basePrice: 45000000,
    finalPrice: 40500000,
    amazingOffer: null,
  },
  {
    id: "mock-b2",
    product: {
      title: "فرش ۶ متری طرح ساده کرم روشن",
      slug: "carpet-simple-light-cream",
      imageUrl: "https://res.cloudinary.com/demo/image/upload/samples/ecommerce/analog-classic.jpg",
      imageBlurDataUrl: null,
    },
    colors: [{ id: "b2-c1", hexCode: "#D8C08A" }],
    basePrice: 18500000,
    finalPrice: 18500000,
    amazingOffer: null,
  },
  {
    id: "mock-b3",
    product: {
      title: "قالیچه ۲ متری طرح بته‌جقه کرمانی",
      slug: "carpet-bote-jeghe-kermani",
      imageUrl: "https://res.cloudinary.com/demo/image/upload/samples/ecommerce/leather-bag-gray.jpg",
      imageBlurDataUrl: null,
    },
    colors: [
      { id: "b3-c1", hexCode: "#2F3B4C" },
      { id: "b3-c2", hexCode: "#B33A3A" },
    ],
    basePrice: 15900000,
    finalPrice: 14310000,
    amazingOffer: null,
  },
  {
    id: "mock-b4",
    product: {
      title: "فرش ۱۲ متری طرح شاه‌عباسی اصفهان",
      slug: "carpet-shah-abbasi-isfahan",
      imageUrl: "https://res.cloudinary.com/demo/image/upload/samples/ecommerce/analog-classic.jpg",
      imageBlurDataUrl: null,
    },
    colors: [{ id: "b4-c1", hexCode: "#3B4A3A" }],
    basePrice: 62000000,
    finalPrice: 62000000,
    amazingOffer: null,
  },
];

/**
 * بخش «پرفروش‌ترین‌ها» در صفحه اصلی — دقیقاً هم‌شکل
 * `LatestProductsSection`: همان `ProductCard` مشترک، هدر با فونت
 * مشکی (نه رنگی/Cherry). فقط آیکون فرق دارد (`TrendingUp`، هم‌راستا
 * با آیکون همین بخش در رفرنس Digikala).
 *
 * `seeAllHref` موقتاً به مسیر آیندهٔ API عمومی اشاره می‌کند؛ صفحهٔ
 * مقصد هنوز طراحی نشده است.
 */
export function BestSellersSection() {
  if (MOCK_BEST_SELLERS.length === 0) return null;

  return (
    <section className="pt-8">
      <div className="px-4 sm:px-6">
        <SectionHeader
          title="پرفروش‌ترین‌ها"
          icon={TrendingUp}
          iconBgClassName="bg-[var(--sf-accent-soft)]"
          iconColorClassName="text-[var(--sf-accent)]"
          titleColorClassName="text-black"
          seeAllHref="/products/best-selling"
          seeAllLabel="مشاهده بیشتر"
          seeAllClassName="text-black text-xs"
        />
      </div>

      <div className="mt-3 flex overflow-x-auto pe-4 [scrollbar-width:none] ps-4 sm:pe-6 sm:ps-6 [&::-webkit-scrollbar]:hidden">
        {MOCK_BEST_SELLERS.map((item) => (
          <ProductCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}
