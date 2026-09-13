import Image from "next/image";
import { Award } from "lucide-react";
import { SectionHeader } from "@/components/storefront/section-header";

export type HomepageBrand = {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  imageBlurDataUrl: string | null;
};

/**
 * ردیف نمایشی برندها در صفحه اصلی — فقط برندهایی که در Dashboard
 * «نمایش در صفحه اصلی» تیک خورده‌اند اینجا می‌آیند (هم‌الگو با
 * `CategoryShortcuts`، همان زبان بصری کارت مربعی).
 *
 * برخلاف `CategoryShortcuts`، این کامپوننت عمداً Server Component
 * ساده است (بدون Auto-Scroll RTL) — چون هنوز صفحه لیست محصولات بر
 * اساس برند ساخته نشده، کارت‌ها فعلاً به هیچ مقصدی Link نمی‌شوند؛
 * فقط نمایش هستند. وقتی صفحه `/brands/[slug]` ساخته شد، افزودن
 * `Link` به همین کامپوننت کافی است.
 */
export function BrandsSection({ brands }: { brands: HomepageBrand[] }) {
  if (brands.length === 0) return null;

  return (
    <section className="px-4 pt-6 sm:px-6">
      <SectionHeader
        title="برندها"
        icon={Award}
        iconBgClassName="bg-[var(--sf-accent-soft)]"
        iconColorClassName="text-[var(--sf-accent)]"
        titleColorClassName="text-black"
      />
      <div
        dir="rtl"
        className="mt-3 flex gap-3 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {brands.map((brand) => (
          <div
            key={brand.id}
            className="flex w-20 shrink-0 flex-col items-center gap-1.5 sm:w-24"
          >
            <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-black/5 bg-white shadow-[0_2px_8px_rgba(3,23,37,0.06)]">
              {brand.imageUrl ? (
                <div className="absolute inset-1.5 overflow-hidden rounded-xl">
                  <Image
                    src={brand.imageUrl}
                    alt={brand.name}
                    fill
                    className="object-cover"
                    placeholder={brand.imageBlurDataUrl ? "blur" : "empty"}
                    blurDataURL={brand.imageBlurDataUrl ?? undefined}
                    sizes="96px"
                  />
                </div>
              ) : (
                <div className="flex h-full w-full items-center justify-center text-gray-300">
                  <Award className="h-7 w-7" strokeWidth={1.5} aria-hidden="true" />
                </div>
              )}
            </div>
            <span className="line-clamp-1 text-xs font-medium text-[var(--sf-ink)]">
              {brand.name}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
