type ProductInfoHeaderProps = {
  title: string;
  categoryName: string | null;
};

/**
 * بخش «دسته‌بندی + عنوان» صفحه جزئیات محصول — Server Component
 * ساده (بدون تعامل). قیمت/موجودی از اینجا حذف شد و به
 * `ProductPurchasePanel` منتقل شد چون حالا به Variant انتخاب‌شده
 * وابسته و Client-side است (قبلاً یک عدد ثابت/نماینده بود).
 *
 * `categoryName` فقط وقتی محصول `category` معتبر Populate‌شده
 * داشته باشد نمایش داده می‌شود (Chip خاکستری ساده، هم‌الگو با
 * رفرنس کارفرما — بدون اختراع دسته‌بندی برای محصولات بدون آن، که
 * در عمل نباید رخ دهد چون `category` در مدل الزامی است).
 */
export function ProductInfoHeader({ title, categoryName }: ProductInfoHeaderProps) {
  return (
    <section className="px-4 pt-4 sm:mx-auto sm:max-w-md sm:px-6">
      {categoryName && (
        <span className="mb-2 inline-block rounded-full bg-gray-200 px-2.5 py-1 text-[11px] font-medium text-gray-600">
          {categoryName}
        </span>
      )}
      <h1 className="text-base font-bold leading-6 text-[var(--sf-ink)]">{title}</h1>
    </section>
  );
}
