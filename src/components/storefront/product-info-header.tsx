import Link from "next/link";
import type { ProductDetailCategory } from "@/lib/storefront/get-product-detail";

type ProductInfoHeaderProps = {
  title: string;
  categories: ProductDetailCategory[];
  brandName: string | null;
};

/**
 * بخش «دسته‌بندی + برند + عنوان» صفحه جزئیات محصول — Server
 * Component ساده (بدون تعامل). قیمت/موجودی از اینجا حذف شد و به
 * `ProductPurchasePanel` منتقل شد چون حالا به Variant انتخاب‌شده
 * وابسته و Client-side است (قبلاً یک عدد ثابت/نماینده بود).
 *
 * **دسته‌بندی‌ها (طبق دستور صریح کارفرما):** هرکدام یک Chip
 * لینک‌شده به `/categories/{slug}` است، نه فقط متن ساده. اگر
 * دسته‌بندی محصول یک والد هم داشته باشد (حداکثر دو سطح در این
 * پروژه)، هر دو کنار هم نمایش داده می‌شوند — `categories[0]` والد
 * (اگر باشد)، آخرین عضو خودِ دسته‌بندی محصول (نگاه کنید
 * `getProductDetailBySlug`).
 *
 * **نکته مهم:** صفحه مقصد `/categories/{slug}` هنوز در Storefront
 * ساخته نشده (فقط `category-shortcuts.tsx` صفحه اصلی هم از قبل به
 * همین مسیر لینک می‌داد، بدون این‌که آن صفحه وجود داشته باشد — یک
 * حفرهٔ از قبل موجود در پروژه، نه چیزی که همین‌جا ایجاد شده باشد).
 * ساختن خودِ آن صفحه (فهرست محصولات یک دسته‌بندی) یک ماژول کاملاً
 * جدا و به‌اندازه صفحه محصول است؛ منتظر دستور/تأیید جدا برای آن.
 *
 * **برند:** یک Chip جدا، با عنوان «برند: نام‌برند» — فقط اگر محصول
 * برند داشته باشد (`Product.brand`)، وگرنه چیزی رندر نمی‌شود.
 */
export function ProductInfoHeader({ title, categories, brandName }: ProductInfoHeaderProps) {
  const hasChips = categories.length > 0 || brandName;

  return (
    <section className="px-4 pt-4 sm:mx-auto sm:max-w-md sm:px-6">
      {hasChips && (
        <div className="mb-2 flex flex-wrap items-center gap-2">
          {categories.map((category) => (
            <Link
              key={category.slug}
              href={`/categories/${category.slug}`}
              className="inline-block rounded-full bg-gray-200 px-2.5 py-1 text-[11px] font-medium text-gray-600 active:bg-gray-300"
            >
              {category.name}
            </Link>
          ))}
          {brandName && (
            <span className="inline-block rounded-full bg-[var(--sf-accent-soft)] px-2.5 py-1 text-[11px] font-medium text-[var(--sf-accent)]">
              برند: {brandName}
            </span>
          )}
        </div>
      )}
      <h1 className="text-base font-bold leading-6 text-[var(--sf-ink)]">{title}</h1>
    </section>
  );
}
