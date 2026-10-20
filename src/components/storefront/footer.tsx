import Link from "next/link";
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

// نماد اعتماد الکترونیکی (اینماد) — کد رسمی دریافت‌شده از enamad.ir
const ENAMAD_CODE = "ENCRHLMNHZmNNk7yHNL3kvsEgipmuBCS";
const ENAMAD_HREF = `https://trustseal.enamad.ir/?id=441102&Code=${ENAMAD_CODE}`;
const ENAMAD_IMG_SRC = `https://trustseal.enamad.ir/logo.aspx?id=441102&Code=${ENAMAD_CODE}`;

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
 * نماد اعتماد الکترونیکی (اینماد) با کد رسمی enamad.ir رندر می‌شود
 * (Server Component، پس HTML نماد در پاسخ اولیه سرور هست).
 */
export function Footer({ socialLinks }: { socialLinks: FooterSocialLink[] }) {
  return (
    <footer className="mt-6 bg-white px-4 pb-6 pt-8 tab:px-6">
      <div className="text-right">
        <h2 className="text-lg font-bold text-[var(--sf-ink)]">فروشگاه اینترنتی فرش سَقَطچی</h2>
        <p className="mt-1 text-[11px] text-[var(--sf-ink)]/50">
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
          <Link key={link.href} href={link.href} className="text-xs text-[var(--sf-ink)]/70">
            {link.label}
          </Link>
        ))}
      </nav>

      <div className="mt-6 flex items-center justify-center">
        <a referrerPolicy="origin" target="_blank" rel="noopener" href={ENAMAD_HREF}>
          {/* نماد رسمی اینماد: باید <img> ساده با همین صفات بماند (Next Image کد تأیید را حذف می‌کند). */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            referrerPolicy="origin"
            src={ENAMAD_IMG_SRC}
            alt=""
            style={{ cursor: "pointer" }}
            {...{ code: ENAMAD_CODE }}
          />
        </a>
      </div>

      <p className="mt-6 text-center text-xs text-[var(--sf-ink)]/40">
        © {CURRENT_JALALI_YEAR} فروشگاه اینترنتی فرش سقطچی. تمامی حقوق محفوظ است.
      </p>
    </footer>
  );
}
