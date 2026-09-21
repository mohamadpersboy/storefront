type ProductTechnicalNotesProps = {
  text: string;
};

/**
 * «ملاحظات فنی» — فقط از `Product.technicalDescription` (متن آزاد،
 * کاملاً جدا از `Product.description` و از جدول
 * `technicalSpecifications`). طبق دستور دقیق کارفرما: بدون
 * بک‌گراند، خیلی ساده — فقط «ملاحظات فنی: (متن)»، نه یک کارت مثل
 * بقیه بخش‌ها.
 */
export function ProductTechnicalNotes({ text }: ProductTechnicalNotesProps) {
  return (
    <section className="px-4 pt-4 pb-1 sm:mx-auto sm:max-w-md sm:px-6">
      <p className="whitespace-pre-line text-xs leading-6 text-gray-500">
        <span className="font-semibold text-[var(--sf-ink)]">ملاحظات فنی: </span>
        {text}
      </p>
    </section>
  );
}
