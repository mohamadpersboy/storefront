import { LayoutGrid } from "lucide-react";
import { SectionHeader } from "@/components/storefront/section-header";
import { ProductCard, type ProductCardData } from "@/components/storefront/product-card";

/**
 * ردیف/کروسل محصول یک دسته‌بندی با اولویت (`sortOrder`) صفر —
 * دقیقاً هم‌شکل `BestSellersSection`/`LatestProductsSection` (همان
 * `ProductCard`، هدر با فونت مشکی، بدون رنگ برند اختصاصی چون این
 * یک دستهٔ عمومی است نه یک بخش تبلیغاتی مثل شگفت‌انگیزها). یک
 * Instance از این Component به‌ازای هر دستهٔ واجد شرایط در
 * `page.tsx` رندر می‌شود (نگاه کنید `getPriorityCategorySections`
 * در `src/lib/storefront/homepage-products.ts`).
 *
 * `seeAllHref` موقتاً به مسیر آیندهٔ صفحهٔ دسته‌بندی اشاره می‌کند؛
 * آن صفحه هنوز طراحی نشده است.
 */
export function CategoryProductsSection({
  title,
  seeAllHref,
  items,
}: {
  title: string;
  seeAllHref: string;
  items: ProductCardData[];
}) {
  if (items.length === 0) return null;

  return (
    <section className="pt-8">
      <div className="px-4 sm:px-6">
        <SectionHeader
          title={title}
          icon={LayoutGrid}
          iconBgClassName="bg-[var(--sf-accent-soft)]"
          iconColorClassName="text-[var(--sf-accent)]"
          titleColorClassName="text-black"
          seeAllHref={seeAllHref}
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
