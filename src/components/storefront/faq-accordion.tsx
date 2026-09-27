import { ChevronDown } from "lucide-react";

export type FaqAccordionItem = {
  id: string;
  question: string;
  answer: string;
};

/**
 * آکاردئون سوالات متداول — عمداً با `<details>`/`<summary>` بومی
 * مرورگر ساخته شده، نه `useState` + یک Client Component. باز/بسته
 * شدن، Toggle چندتایی مستقل (هر سوال جدا از بقیه)، و در دسترس‌پذیری
 * پایه (Role ضمنی Disclosure) همه رایگان از خود HTML می‌آیند — نیازی
 * به جاوااسکریپت اضافه در Client نیست (هم‌راستا با اصل «از
 * JavaScript اضافی در Client جلوگیری کن»).
 *
 * چرخش فلش (`ChevronDown` → رو به بالا) با `group-open:rotate-180`
 * (ویژگی Tailwind برای استایل‌دهی بر اساس صفت `open` والد `details`)
 * — باز هم بدون هیچ State ای در React.
 */
export function FaqAccordion({ items }: { items: FaqAccordionItem[] }) {
  return (
    <div className="flex flex-col gap-3">
      {items.map((item) => (
        <details key={item.id} className="group rounded-2xl bg-white p-4 shadow-sm">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
            <span className="text-sm font-semibold text-[var(--sf-ink)]">
              {item.question}
            </span>
            <ChevronDown
              className="size-4 shrink-0 text-[var(--sf-ink)]/40 transition-transform duration-200 group-open:rotate-180"
              strokeWidth={2}
              aria-hidden="true"
            />
          </summary>
          <p className="mt-3 whitespace-pre-line text-sm leading-7 text-gray-600">
            {item.answer}
          </p>
        </details>
      ))}
    </div>
  );
}
