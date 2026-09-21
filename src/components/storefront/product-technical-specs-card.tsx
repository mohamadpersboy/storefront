import { Fragment } from "react";
import { ListChecks } from "lucide-react";

type ProductTechnicalSpecsCardProps = {
  specs: { key: string; value: string }[];
};

/**
 * کارت «ویژگی‌های فنی» — Grid دو‌ستونه (نه یک `<table>` واقعی؛
 * برای اینکه هر خانه هم‌زمان گوشه‌گرد باشد هم ۴px از خانه‌های
 * اطرافش فاصله داشته باشد، CSS Grid با `gap` قابل‌اطمینان‌تر از
 * `border-spacing` روی یک Table واقعی است — HTML خروجی بصری همان
 * جدولی است که کارفرما خواسته).
 *
 * طبق دستور دقیق کارفرما:
 * - ستون عنوان ⅓ عرض کل، ستون مقدار ⅔ عرض کل
 *   (`grid-cols-[1fr_2fr]`).
 * - هر سطر/ستون ۴px فاصله (`gap-1` = ۰٫۲۵rem = ۴px).
 * - خانه‌ها گوشه‌گرد و بک‌گراند سفید.
 * - ستون عنوان وسط‌چین، ستون مقدار راست‌چین.
 * - «هدر سراسری» (عنوان کل بخش، نه هدر هر ستون) هم بک‌گراند سفید و
 *   گوشه‌گرد — هم‌الگو با `ProductDescriptionCard` (آیکن در دایره
 *   رنگی + عنوان Bold).
 *
 * خودِ ناحیه Grid یک بک‌گراند خاکستری روشن دارد (`bg-gray-100`) تا
 * فاصله ۴px بین خانه‌های سفید واقعاً *دیده* شود — روی یک بک‌گراند
 * کاملاً سفید (هم‌رنگ کارت)، آن فاصله‌ها اصلاً قابل‌تشخیص نبودند.
 *
 * فقط از `Product.technicalSpecifications` (`key`/`value`) —
 * `Product.technicalDescription` (متن آزاد جدا) هنوز طراحی نشده،
 * منتظر دستور بعدی کارفرما.
 */
export function ProductTechnicalSpecsCard({ specs }: ProductTechnicalSpecsCardProps) {
  return (
    <section className="px-4 pt-3 sm:mx-auto sm:max-w-md sm:px-6">
      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--sf-accent-soft)] text-[var(--sf-accent)]">
            <ListChecks className="h-4 w-4" strokeWidth={1.9} aria-hidden="true" />
          </span>
          <p className="text-sm font-semibold text-[var(--sf-ink)]">ویژگی‌های فنی</p>
        </div>

        <div className="grid grid-cols-[1fr_2fr] gap-1 rounded-xl bg-gray-100 p-1">
          {specs.map((spec, index) => (
            <Fragment key={index}>
              <div className="rounded-lg bg-white px-3 py-2.5 text-center text-xs font-medium text-[var(--sf-ink)]">
                {spec.key}
              </div>
              <div className="rounded-lg bg-white px-3 py-2.5 text-right text-xs text-gray-600">
                {spec.value}
              </div>
            </Fragment>
          ))}
        </div>
      </div>
    </section>
  );
}
