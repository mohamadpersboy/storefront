import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export type AboutUsCardData = {
  title: string;
  content: string;
};

/**
 * کارت «درباره ما» در صفحه اصلی — داده واقعی از Dashboard →
 * تنظیمات → درباره ما (`getAboutUs()`، مثل Footer که مستقیم
 * `getSocialLinks()` را می‌خواند). متن با `line-clamp-3` خلاصه
 * می‌شود؛ ادامه‌اش با «بیشتر بدانید» به `/about` می‌رود (همان مسیر
 * آیندهٔ لینک «درباره ما» در Footer).
 *
 * پس‌زمینهٔ تیره همان `--sf-ink` برند خودمان است (نه رنگ اختیاری
 * جدید)؛ طبق درخواست صریح کارفرما، سایز فونت‌ها کوچک نگه داشته
 * شده، بزرگ‌تر از بقیهٔ صفحه نیست.
 */
export function AboutUsCard({ title, content }: AboutUsCardData) {
  if (!content) return null;

  return (
    <section className="px-4 pt-6 sm:px-6">
      <div className="rounded-2xl bg-[var(--sf-ink)] p-5">
        <h2 className="text-base font-bold text-white">{title}</h2>
        <p className="mt-3 line-clamp-3 text-sm leading-7 text-white/60">{content}</p>
        <Link
          href="/about"
          className="mt-4 flex items-center justify-end gap-0.5 text-sm font-medium text-[var(--sf-accent)]"
        >
          <span>بیشتر بدانید</span>
          <ChevronLeft className="size-4" />
        </Link>
      </div>
    </section>
  );
}
