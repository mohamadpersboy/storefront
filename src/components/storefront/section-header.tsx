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
  /** پیش‌فرض `text-[var(--sf-ink)]` — برای هماهنگی با رنگ برند همان بخش قابل بازنویسی است. */
  titleColorClassName?: string;
  /** اگر صفحه «مشاهده همه/بیشتر» هنوز آماده نباشد، این Prop را ندهید. */
  seeAllHref?: string;
  /** پیش‌فرض «مشاهده همه» */
  seeAllLabel?: string;
  /** پیش‌فرض `text-[var(--sf-accent)] text-sm` — رنگ+سایز فونت لینک «مشاهده همه/بیشتر» */
  seeAllClassName?: string;
};

/**
 * هدر مشترک ردیف‌های محصول در صفحه اصلی (شگفت‌انگیزها، جدیدترین‌ها،
 * پرتخفیف‌ترین‌ها، پرفروش‌ترین‌ها و...) — طبق رفرنس بصری کارفرما:
 * سمت راست دایره آیکون رنگی + عنوان بخش، سمت چپ «مشاهده همه/بیشتر» +
 * فلش. یک‌بار اینجا ساخته شده تا هر ردیف بعدی همین کامپوننت را
 * دوباره استفاده کند و کد تکراری نداشته باشیم (بند ۷ و ۱۶ Master
 * Workflow).
 */
export function SectionHeader({
  title,
  icon: Icon,
  iconBgClassName,
  iconColorClassName,
  titleColorClassName = "text-[var(--sf-ink)]",
  seeAllHref,
  seeAllLabel = "مشاهده همه",
  seeAllClassName = "text-[var(--sf-accent)] text-sm",
}: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span
          className={`flex size-7 shrink-0 items-center justify-center rounded-full ${iconBgClassName}`}
        >
          <Icon className={`size-4 ${iconColorClassName}`} />
        </span>
        <h2 className={`text-base font-bold sm:text-lg ${titleColorClassName}`}>{title}</h2>
      </div>

      {seeAllHref ? (
        <Link href={seeAllHref} className={`flex items-center gap-0.5 font-medium ${seeAllClassName}`}>
          <span>{seeAllLabel}</span>
          <ChevronLeft className="size-4" />
        </Link>
      ) : null}
    </div>
  );
}
