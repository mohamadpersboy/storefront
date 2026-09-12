import { Clock } from "lucide-react";
import { SectionHeader } from "@/components/storefront/section-header";
import { ProductCard, type ProductCardData } from "@/components/storefront/product-card";

/**
 * داده Mock — هنوز API عمومی `GET /api/v1/products/latest` ساخته
 * نشده. عمداً یکی از آیتم‌ها (`mock-l2`) هم‌زمان `amazingOffer` دارد
 * تا سناریوی «محصولی که هم جدید است هم شگفت‌انگیز» تست بصری شود:
 * برچسب/Progress Bar/تایمر فقط روی همان یک کارت نمایش داده می‌شود
 * ولی چون بقیهٔ کارت‌ها همان فضا را (پنهان با `invisible`) رزرو
 * کرده‌اند، ارتفاع همهٔ کارت‌های ردیف یکسان می‌ماند.
 */
const MOCK_LATEST_PRODUCTS: ProductCardData[] = [
  {
    id: "mock-l1",
    product: {
      title: "فرش ۹ متری طرح افشان یزد",
      slug: "carpet-afshan-yazd",
      imageUrl: "https://res.cloudinary.com/demo/image/upload/samples/ecommerce/leather-bag-gray.jpg",
      imageBlurDataUrl: null,
    },
    colors: [
      { id: "l1-c1", hexCode: "#8C2F39" },
      { id: "l1-c2", hexCode: "#E8DCC4" },
    ],
    basePrice: 39900000,
    finalPrice: 39900000,
    amazingOffer: null,
  },
  {
    id: "mock-l2",
    product: {
      title: "فرش ۶ متری طرح خشتی مدرن",
      slug: "carpet-kheshti-modern",
      imageUrl: "https://res.cloudinary.com/demo/image/upload/samples/ecommerce/analog-classic.jpg",
      imageBlurDataUrl: null,
    },
    colors: [
      { id: "l2-c1", hexCode: "#2F3B4C" },
      { id: "l2-c2", hexCode: "#B33A3A" },
      { id: "l2-c3", hexCode: "#D8C08A" },
    ],
    basePrice: 24500000,
    finalPrice: 20825000,
    // این محصول هم‌زمان شگفت‌انگیز هم هست (سناریوی مخلوط، توضیح بالا).
    amazingOffer: {
      startAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      endAt: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
    },
  },
  {
    id: "mock-l3",
    product: {
      title: "قالیچه ۱.۵ متری طرح سنتی تبریز",
      slug: "carpet-tabriz-traditional",
      imageUrl: "https://res.cloudinary.com/demo/image/upload/samples/ecommerce/leather-bag-gray.jpg",
      imageBlurDataUrl: null,
    },
    colors: [{ id: "l3-c1", hexCode: "#3B4A3A" }],
    basePrice: 12900000,
    finalPrice: 12900000,
    amazingOffer: null,
  },
  {
    id: "mock-l4",
    product: {
      title: "فرش ۱۲ متری طرح گلستان کاشان",
      slug: "carpet-golestan-kashan",
      imageUrl: "https://res.cloudinary.com/demo/image/upload/samples/ecommerce/analog-classic.jpg",
      imageBlurDataUrl: null,
    },
    colors: [
      { id: "l4-c1", hexCode: "#7A1F1F" },
      { id: "l4-c2", hexCode: "#1F2937" },
    ],
    basePrice: 51000000,
    finalPrice: 51000000,
    amazingOffer: null,
  },
];

/**
 * بخش «جدیدترین محصولات» در صفحه اصلی. برخلاف «شگفت‌انگیزها»، رنگ
 * برند این بخش رنگی/Cherry نیست — طبق درخواست صریح کارفرما فقط
 * فونت‌های هدر (عنوان + «مشاهده بیشتر») مشکی‌اند. کارت‌ها همان
 * `ProductCard` مشترک هستند؛ برچسب/Progress Bar/تایمر شگفت‌انگیز
 * فقط برای محصولاتی که واقعاً `amazingOffer` دارند نمایش داده
 * می‌شود (نگاه کنید به توضیح بالای Mock Data).
 *
 * `seeAllHref` موقتاً به مسیر آیندهٔ API عمومی اشاره می‌کند؛ صفحهٔ
 * مقصد هنوز طراحی نشده است.
 */
export function LatestProductsSection() {
  if (MOCK_LATEST_PRODUCTS.length === 0) return null;

  return (
    <section className="pt-5">
      <div className="px-4 sm:px-6">
        <SectionHeader
          title="جدیدترین محصولات"
          icon={Clock}
          iconBgClassName="bg-[var(--sf-accent-soft)]"
          iconColorClassName="text-[var(--sf-accent)]"
          titleColorClassName="text-black"
          seeAllHref="/products/latest"
          seeAllLabel="مشاهده بیشتر"
          seeAllClassName="text-black text-xs"
        />
      </div>

      <div className="mt-3 flex overflow-x-auto pe-4 [scrollbar-width:none] ps-4 sm:pe-6 sm:ps-6 [&::-webkit-scrollbar]:hidden">
        {MOCK_LATEST_PRODUCTS.map((item) => (
          <ProductCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}
