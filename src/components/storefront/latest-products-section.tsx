import { Clock } from "lucide-react";
import { SectionHeader } from "@/components/storefront/section-header";
import { ProductCard, type ProductCardData } from "@/components/storefront/product-card";

/**
 * بخش «جدیدترین‌ها» در صفحه اصلی. برخلاف «شگفت‌انگیزها»، رنگ
 * برند این بخش رنگی/Cherry نیست — طبق درخواست صریح کارفرما فقط
 * فونت‌های هدر (عنوان + «مشاهده بیشتر») مشکی‌اند. کارت‌ها همان
 * `ProductCard` مشترک هستند؛ برچسب/Progress Bar/تایمر شگفت‌انگیز
 * فقط برای محصولاتی که واقعاً همزمان یک `AmazingOffer` فعال هم
 * دارند نمایش داده می‌شود.
 *
 * `items` جدیدترین محصولات منتشرشده واقعی هستند
 * (`getLatestProductCards` در
 * `src/lib/storefront/homepage-products.ts`) — دیگر Mock نیست.
 *
 * `seeAllHref` موقتاً به مسیر آیندهٔ API عمومی اشاره می‌کند؛ صفحهٔ
 * مقصد هنوز طراحی نشده است.
 */
export function LatestProductsSection({ items }: { items: ProductCardData[] }) {
  if (items.length === 0) return null;

  return (
    <section className="pt-8">
      <div className="px-4 sm:px-6">
        <SectionHeader
          title="جدیدترین‌ها"
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
        {items.map((item) => (
          <ProductCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}
