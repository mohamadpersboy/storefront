import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type SectionHeaderProps = {
  title: string;
  icon: LucideIcon;
  /** کلاس رنگ پس‌زمینه دایره آیکون، مثلاً "bg-amber-50" */
  iconBgClassName: string;
  /** کلاس رنگ خود آیکون، مثلاً "text-amber-600" */
  iconColorClassName: string;
  /** اگر صفحه «مشاهده همه» هنوز آماده نباشد، این Prop را ندهید. */
  seeAllHref?: string;
};

/**
 * هدر مشترک ردیف‌های محصول در صفحه اصلی (شگفت‌انگیزها، جدیدترین‌ها،
 * پرتخفیف‌ترین‌ها، پرفروش‌ترین‌ها و...) — طبق رفرنس بصری کارفرما:
 * سمت راست دایره آیکون رنگی + عنوان بخش، سمت چپ «مشاهده همه» +
 * فلش. یک‌بار اینجا ساخته شده تا هر ردیف بعدی همین کامپوننت را
 * دوباره استفاده کند و کد تکراری نداشته باشیم (بند ۷ و ۱۶ Master
 * Workflow).
 */
export function SectionHeader({
  title,
  icon: Icon,
  iconBgClassName,
  iconColorClassName,
  seeAllHref,
}: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span
          className={`flex size-7 shrink-0 items-center justify-center rounded-full ${iconBgClassName}`}
        >
          <Icon className={`size-4 ${iconColorClassName}`} />
        </span>
        <h2 className="text-base font-bold text-[var(--sf-ink)] sm:text-lg">
          {title}
        </h2>
      </div>

      {seeAllHref ? (
        <Link
          href={seeAllHref}
          className="flex items-center gap-0.5 text-sm font-medium text-[var(--sf-accent)]"
        >
          <span>مشاهده همه</span>
          <ChevronLeft className="size-4" />
        </Link>
      ) : null}
    </div>
  );
}
