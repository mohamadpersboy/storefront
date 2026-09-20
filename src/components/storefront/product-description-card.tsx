import { NotebookText } from "lucide-react";

type ProductDescriptionCardProps = {
  description: string;
};

/**
 * کارت «توضیحات محصول» — فقط از فیلد واقعی `Product.description`
 * (متن آزاد، مثل رفرنس کارفرما). اگر محصول توضیحات نداشته باشد،
 * خودِ `page.tsx` اصلاً این کامپوننت را رندر نمی‌کند (نه یک حالت
 * خالی این‌جا).
 *
 * عمداً «توضیحات/ویژگی‌های فنی» (`Product.technicalDescription` /
 * `technicalSpecifications`) این‌جا نیست — طبق دستور صریح کارفرما:
 * «اگر بخش توضیحات فنی وجود نداره، فعلاً طراحی نکن تا خودم توضیح
 * بدم». آن یک ماژول جداست، منتظر دستور بعدی.
 */
export function ProductDescriptionCard({ description }: ProductDescriptionCardProps) {
  return (
    <section className="px-4 pt-3 sm:mx-auto sm:max-w-md sm:px-6">
      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="mb-2 flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--sf-accent-soft)] text-[var(--sf-accent)]">
            <NotebookText className="h-4 w-4" strokeWidth={1.9} aria-hidden="true" />
          </span>
          <p className="text-sm font-semibold text-[var(--sf-ink)]">توضیحات محصول</p>
        </div>
        <p className="whitespace-pre-line text-sm leading-7 text-gray-600">{description}</p>
      </div>
    </section>
  );
}
