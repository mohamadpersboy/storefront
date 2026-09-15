import { Sparkles } from "lucide-react";
import { SectionHeader } from "@/components/storefront/section-header";
import { ProductCard, type ProductCardData } from "@/components/storefront/product-card";

/**
 * بخش «شگفت‌انگیزها» در صفحه اصلی — هدر + ردیف `ProductCard`
 * (کامپوننت مشترک بین همهٔ ردیف‌های محصول صفحه اصلی). آیکون
 * Sparkles همان آیکونی است که Dashboard برای «تخفیف‌های
 * شگفت‌انگیز» استفاده می‌کند تا برندینگ هماهنگ بماند؛ رنگ برند این
 * بخش (آیکون + عنوان + «مشاهده بیشتر») قرمز آلبالویی است.
 *
 * `items` از Offerهای واقعاً فعال `AmazingOffer` در DB می‌آید
 * (`getAmazingOfferProductCards` در
 * `src/lib/storefront/homepage-products.ts`) — دیگر Mock نیست.
 *
 * `seeAllHref` به‌صورت موقت به مسیر آیندهٔ API عمومی اشاره
 * می‌کند؛ صفحهٔ مقصد («مشاهده بیشتر») هنوز طراحی نشده است.
 */
export function AmazingOffersSection({ items }: { items: ProductCardData[] }) {
  if (items.length === 0) return null;

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
        {items.map((item) => (
          <ProductCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}
