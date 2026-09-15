import { TrendingUp } from "lucide-react";
import { SectionHeader } from "@/components/storefront/section-header";
import { ProductCard, type ProductCardData } from "@/components/storefront/product-card";

/**
 * بخش «پرفروش‌ترین‌ها» در صفحه اصلی — دقیقاً هم‌شکل
 * `LatestProductsSection`: همان `ProductCard` مشترک، هدر با فونت
 * مشکی (نه رنگی/Cherry). فقط آیکون فرق دارد (`TrendingUp`، هم‌راستا
 * با آیکون همین بخش در رفرنس Digikala).
 *
 * `items` بر اساس مجموع فروش واقعی هر محصول از Orderها محاسبه
 * می‌شود (`getBestSellerProductCards` در
 * `src/lib/storefront/homepage-products.ts`) — دیگر Mock نیست.
 *
 * `seeAllHref` موقتاً به مسیر آیندهٔ API عمومی اشاره می‌کند؛ صفحهٔ
 * مقصد هنوز طراحی نشده است.
 */
export function BestSellersSection({ items }: { items: ProductCardData[] }) {
  if (items.length === 0) return null;

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
        {items.map((item) => (
          <ProductCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}
