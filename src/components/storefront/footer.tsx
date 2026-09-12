import Link from "next/link";
import { ShieldQuestion } from "lucide-react";
import {
  EitaaIcon,
  InstagramIcon,
  RubikaIcon,
  TelegramIcon,
  WhatsappIcon,
} from "@/components/storefront/social-icons";
import type { SocialPlatform } from "@/models/SocialLinks";

export type FooterSocialLink = {
  platform: SocialPlatform;
  url: string;
};

const PLATFORM_META: Record<SocialPlatform, { label: string; Icon: typeof InstagramIcon }> = {
  instagram: { label: "اینستاگرام", Icon: InstagramIcon },
  telegram: { label: "تلگرام", Icon: TelegramIcon },
  whatsapp: { label: "واتساپ", Icon: WhatsappIcon },
  rubika: { label: "روبیکا", Icon: RubikaIcon },
  eitaa: { label: "ایتا", Icon: EitaaIcon },
};

const QUICK_LINKS = [
  { label: "درباره ما", href: "/about" },
  { label: "تماس با ما", href: "/contact" },
  { label: "سوالات متداول", href: "/faq" },
  { label: "قوانین و مقررات", href: "/terms" },
];

const CURRENT_JALALI_YEAR = "۱۴۰۵";

/**
 * Footer صفحه اصلی. آیکون‌های شبکهٔ اجتماعی داده‌محورند: فقط
 * پلتفرم‌هایی که در Dashboard → تنظیمات → شبکه‌های اجتماعی هم URL
 * دارند و هم فعال شده‌اند نمایش داده می‌شوند (`socialLinks` را
 * `page.tsx` مستقیم از `getSocialLinks()` می‌خواند، هم‌الگو با
 * بقیهٔ بخش‌های صفحه اصلی مثل بنرها/دسته‌بندی‌ها).
 *
 * لینک‌های «درباره ما»/«تماس با ما»/«سوالات متداول»/«قوانین و
 * مقررات» موقتاً به مسیرهای آیندهٔ هنوز طراحی‌نشده اشاره می‌کنند
 * (همان الگوی «مشاهده بیشتر» در بخش‌های قبلی).
 *
 * جای نماد اعتماد الکترونیکی (اینماد) عمداً یک Placeholder صادقانه
 * است، نه یک نشان جعلی — تا وقتی مجوز رسمی از enamad.ir دریافت و
 * کد HTML واقعی آن جایگزین نشده.
 */
export function Footer({ socialLinks }: { socialLinks: FooterSocialLink[] }) {
  return (
    <footer className="mt-8 bg-white px-4 pb-6 pt-8 sm:px-6">
      <div className="text-center">
        <h2 className="text-lg font-bold text-[var(--sf-ink)]">فرش سقطچی</h2>
        <p className="mt-1 text-sm text-[var(--sf-ink)]/60">
          فروشگاه اینترنتی تخصصی فرش، تحویل درب منزل در سراسر کشور
        </p>
      </div>

      {socialLinks.length > 0 ? (
        <div className="mt-5 flex items-center justify-center gap-3">
          {socialLinks.map(({ platform, url }) => {
            const meta = PLATFORM_META[platform];
            return (
              <a
                key={platform}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={meta.label}
                className="flex size-11 items-center justify-center rounded-full bg-gray-100 text-[var(--sf-ink)] transition-colors hover:bg-gray-200"
              >
                <meta.Icon className="size-5" />
              </a>
            );
          })}
        </div>
      ) : null}

      <nav className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
        {QUICK_LINKS.map((link) => (
          <Link key={link.href} href={link.href} className="text-sm text-[var(--sf-ink)]/70">
            {link.label}
          </Link>
        ))}
      </nav>

      <div className="mt-6 flex items-center gap-3 rounded-xl border border-dashed border-gray-300 p-3">
        <ShieldQuestion className="size-8 shrink-0 text-[var(--sf-ink)]/40" />
        <p className="text-xs leading-5 text-[var(--sf-ink)]/60">
          جایگاه نماد اعتماد الکترونیکی (اینماد) — پس از دریافت مجوز رسمی از enamad.ir جایگزین شود
        </p>
      </div>

      <p className="mt-6 text-center text-xs text-[var(--sf-ink)]/40">
        © {CURRENT_JALALI_YEAR} فروشگاه اینترنتی فرش سقطچی. تمامی حقوق محفوظ است.
      </p>
    </footer>
  );
}
