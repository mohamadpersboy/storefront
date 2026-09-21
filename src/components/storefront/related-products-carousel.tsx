import type { LucideIcon } from "lucide-react";
import { SectionHeader } from "@/components/storefront/section-header";
import { ProductCard, type ProductCardData } from "@/components/storefront/product-card";

type RelatedProductsCarouselProps = {
  title: string;
  icon: LucideIcon;
  iconBgClassName: string;
  iconColorClassName: string;
  items: ProductCardData[];
};

/**
 * ردیف افقی محصولات مرتبط برای صفحه محصول (مثلاً «محصولات مشابه»،
 * «همراه با این محصول خریده شده است») — عمداً هم‌ساختار با ردیف‌های
 * صفحه اصلی (`LatestProductsSection` و بقیه: همان `SectionHeader` +
 * همان اسکرول افقی `ProductCard`)، اما یک کامپوننت عمومی/مشترک
 * برای هر دو، چون تنها تفاوتشان عنوان/آیکون/دادهٔ ورودی است، نه
 * ساختار.
 *
 * بدون دکمه «مشاهده بیشتر» (طبق دستور صریح کارفرما) — `seeAllHref`
 * به `SectionHeader` داده نمی‌شود.
 */
export function RelatedProductsCarousel({
  title,
  icon,
  iconBgClassName,
  iconColorClassName,
  items,
}: RelatedProductsCarouselProps) {
  if (items.length === 0) return null;

  return (
    <section className="pt-8">
      <div className="px-4 sm:px-6">
        <SectionHeader
          title={title}
          icon={icon}
          iconBgClassName={iconBgClassName}
          iconColorClassName={iconColorClassName}
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
