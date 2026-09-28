import type { CSSProperties, ComponentType } from "react";
import {
  ChevronLeft,
  Clock,
  Headphones,
  Mail,
  MapPin,
  MessageCircle,
  Navigation,
  Phone,
  PhoneCall,
} from "lucide-react";
import { connectToDatabase } from "@/lib/db/connect";
import { getContactUs } from "@/models/ContactUs";
import { getSocialLinks } from "@/models/SocialLinks";
import { PageHeader } from "@/components/storefront/page-header";
import { EmptyState } from "@/components/storefront/empty-state";
import { InstagramIcon } from "@/components/storefront/social-icons";
import { buildSupportContactItems } from "@/lib/storefront/support-contact-items";

export const revalidate = 60;

type ContactUsData = {
  phone: string;
  secondaryPhone: string;
  email: string;
  address: string;
  workingHours: string;
  latitude: number | null;
  longitude: number | null;
  supportAdminLink: string;
  telegramLink: string;
  whatsappLink: string;
  rubikaLink: string;
  eitaaLink: string;
  instagramLink: string;
};

const EMPTY_CONTACT: ContactUsData = {
  phone: "",
  secondaryPhone: "",
  email: "",
  address: "",
  workingHours: "",
  latitude: null,
  longitude: null,
  supportAdminLink: "",
  telegramLink: "",
  whatsappLink: "",
  rubikaLink: "",
  eitaaLink: "",
  instagramLink: "",
};

/**
 * دو منبع داده دارد و عمداً ادغامشان می‌کند:
 * - `ContactUs` (تنظیمات ← تماس با ما): منبع اصلی تلفن/ایمیل/آدرس و
 *   لینک پیام‌رسان‌ها.
 * - `SocialLinks` (تنظیمات ← شبکه‌های اجتماعی، همان که Footer می‌خواند):
 *   اینستاگرام فقط این‌جاست؛ برای بقیه پلتفرم‌ها هم فقط وقتی استفاده
 *   می‌شود که در `ContactUs` لینکی ثبت نشده باشد. یعنی ادمین هر جا
 *   لینک را وارد کرده باشد، آیکونش این‌جا دیده می‌شود، و اگر هر دو را
 *   پر کرده باشد `ContactUs` مقدم است. فقط لینک‌های «فعال» می‌آیند.
 */
async function getContactUsSafe(): Promise<ContactUsData> {
  try {
    await connectToDatabase();
    const doc = await getContactUs();

    let social: Record<string, string> = {};
    try {
      const settings = await getSocialLinks();
      social = Object.fromEntries(
        settings.links
          .filter((l) => l.isActive && l.url.trim().length > 0)
          .map((l) => [l.platform, l.url.trim()]),
      );
    } catch {
      // لینک‌های اجتماعی اختیاری‌اند؛ خرابی‌شان صفحه را نمی‌شکند.
    }

    return {
      phone: doc.phone,
      secondaryPhone: doc.secondaryPhone,
      email: doc.email,
      address: doc.address,
      workingHours: doc.workingHours,
      latitude: doc.latitude,
      longitude: doc.longitude,
      supportAdminLink: doc.supportAdminLink,
      telegramLink: doc.telegramLink.trim() || social.telegram || "",
      whatsappLink: doc.whatsappLink.trim() || social.whatsapp || "",
      rubikaLink: doc.rubikaLink.trim() || social.rubika || "",
      eitaaLink: doc.eitaaLink.trim() || social.eitaa || "",
      instagramLink: social.instagram || "",
    };
  } catch {
    // اگر DB در دسترس نبود، صفحه نباید خراب شود — همان Empty State
    // «هنوز راه ارتباطی ثبت نشده» نمایش داده می‌شود (هم‌الگو با
    // `getActiveBanners()` در صفحه اصلی).
    return EMPTY_CONTACT;
  }
}

type Channel = {
  key: string;
  label: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  /** پس‌زمینه گرادیان دایره آیکون (آیکون همیشه سفید است). */
  tile: string;
  glow: string;
};

const CHANNEL_ORDER = ["admin", "instagram", "telegram", "whatsapp", "rubika", "eitaa"] as const;

const CHANNEL_STYLE: Record<string, { label?: string; tile: string; glow: string }> = {
  admin: {
    label: "پشتیبانی",
    tile: "linear-gradient(145deg, #022e5b, #031725)",
    glow: "rgba(2, 46, 91, 0.45)",
  },
  instagram: {
    tile: "linear-gradient(45deg, #f9a03f 0%, #e1306c 50%, #7b3fc4 100%)",
    glow: "rgba(225, 48, 108, 0.45)",
  },
  telegram: {
    tile: "linear-gradient(145deg, #3bb4ee, #1e8fd0)",
    glow: "rgba(38, 165, 228, 0.5)",
  },
  whatsapp: {
    tile: "linear-gradient(145deg, #3ee07e, #1aa952)",
    glow: "rgba(37, 211, 102, 0.5)",
  },
  rubika: {
    tile: "linear-gradient(145deg, #a266b6, #5e2f70)",
    glow: "rgba(121, 67, 135, 0.5)",
  },
  eitaa: {
    tile: "linear-gradient(145deg, #3d9af0, #1769c2)",
    glow: "rgba(30, 136, 229, 0.5)",
  },
};

function buildChannels(data: ContactUsData): Channel[] {
  const shared = buildSupportContactItems(data);
  const byKey = new Map<string, Channel>();

  for (const item of shared) {
    if (item.key === "phone") continue; // تلفن‌ها کارت جدا دارند
    const style = CHANNEL_STYLE[item.key];
    if (!style) continue;
    byKey.set(item.key, {
      key: item.key,
      label: style.label ?? item.title,
      href: item.href,
      icon: item.icon,
      tile: style.tile,
      glow: style.glow,
    });
  }

  if (data.instagramLink.trim()) {
    const style = CHANNEL_STYLE.instagram;
    byKey.set("instagram", {
      key: "instagram",
      label: "اینستاگرام",
      href: data.instagramLink.trim(),
      icon: InstagramIcon,
      tile: style.tile,
      glow: style.glow,
    });
  }

  return CHANNEL_ORDER.flatMap((key) => {
    const channel = byKey.get(key);
    return channel ? [channel] : [];
  });
}

const cardBase =
  "rounded-3xl bg-white ring-1 ring-black/5 shadow-[0_10px_30px_-14px_rgba(3,23,37,0.28)]";

function toTelHref(phone: string) {
  return `tel:${phone.replace(/\s+/g, "")}`;
}

function IconTile({
  icon: Icon,
  gradient,
  glow,
}: {
  icon: ComponentType<{ className?: string }>;
  gradient: string;
  glow: string;
}) {
  return (
    <span
      className="flex size-12 shrink-0 items-center justify-center rounded-2xl text-white"
      style={{ backgroundImage: gradient, boxShadow: `0 8px 18px -8px ${glow}` }}
    >
      <Icon className="size-6" />
    </span>
  );
}

/**
 * صفحه «تماس با ما». اولویت نمایش (طبق درخواست کارفرما):
 * آدرس ← تلفن تماس ← تلفن تماس دوم ← ایمیل ← شبکه‌های اجتماعی و
 * پیام‌رسان‌ها (آیکون‌ها کنار هم، نه فهرست زیرهم).
 *
 * هر بخش فقط وقتی رندر می‌شود که داده‌اش ثبت شده باشد؛ اگر هیچ‌چیز
 * ثبت نشده باشد Empty State نشان داده می‌شود. کاملاً Server
 * Component است (لینک‌های ساده `tel:`/`mailto:`، بدون State).
 */
export default async function ContactPage() {
  const contact = await getContactUsSafe();

  const phones = [
    { key: "phone", label: "تلفن تماس", value: contact.phone.trim() },
    { key: "phone2", label: "تلفن تماس دوم", value: contact.secondaryPhone.trim() },
  ].filter((p) => p.value.length > 0);

  const address = contact.address.trim();
  const email = contact.email.trim();
  const hours = contact.workingHours.trim();
  const hasMap = contact.latitude !== null && contact.longitude !== null;
  const channels = buildChannels(contact);

  const isEmpty =
    phones.length === 0 && !address && !hasMap && !email && channels.length === 0;

  let step = 0;
  const enter = (): CSSProperties =>
    ({ "--d": `${120 + step++ * 80}ms` }) as CSSProperties;

  return (
    <div>
      <PageHeader title="تماس با ما" />

      <div className="px-4 pb-10 pt-4 sm:mx-auto sm:max-w-2xl sm:px-6">
        {isEmpty ? (
          <EmptyState
            icon={MessageCircle}
            title="هنوز راه ارتباطی ثبت نشده"
            description="به‌زودی راه‌های تماس با فروشگاه این‌جا نمایش داده می‌شود."
            actionLabel="بازگشت به صفحه اصلی"
            actionHref="/"
          />
        ) : (
          <>
            {/* Hero */}
            <section
              className="sf-fade-up relative overflow-hidden rounded-[2rem] px-5 pb-14 pt-6 text-white"
              style={{
                backgroundImage:
                  "linear-gradient(135deg, #031725 0%, #022e5b 58%, #2f6fb8 130%)",
              }}
            >
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -left-10 -top-12 size-44 rounded-full bg-[var(--sf-accent)]/30 blur-3xl"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -bottom-10 right-4 size-32 rounded-full bg-white/10 blur-2xl"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 opacity-60 [background-image:radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.12)_1px,transparent_0)] [background-size:18px_18px] [mask-image:linear-gradient(to_bottom,black,transparent_85%)]"
              />

              <div className="relative flex items-start gap-3">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20 backdrop-blur">
                  <Headphones className="size-6" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <h2 className="text-xl font-bold leading-8">با ما در ارتباط باشید</h2>
                  <p className="mt-1 text-xs leading-6 text-white/70">
                    برای مشاوره خرید فرش، پیگیری سفارش و ارسال، همیشه پاسخگوی شما هستیم.
                  </p>
                </div>
              </div>

              {hours ? (
                <div className="relative mt-4 inline-flex max-w-full items-start gap-2 rounded-2xl bg-white/10 px-3 py-2 text-[11px] leading-5 text-white/90 ring-1 ring-white/15 backdrop-blur">
                  <Clock className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                  <span className="whitespace-pre-line">{hours}</span>
                </div>
              ) : null}
            </section>

            <div className="relative -mt-9 space-y-3 px-2">
              {/* ۱) آدرس */}
              {address || hasMap ? (
                <section className={`sf-fade-up p-4 ${cardBase}`} style={enter()}>
                  <div className="flex items-start gap-3">
                    <IconTile
                      icon={MapPin}
                      gradient="linear-gradient(145deg, #ff7a6b, #e11d48)"
                      glow="rgba(225, 29, 72, 0.4)"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-[var(--sf-ink)]/50">
                        {address ? "آدرس" : "موقعیت فروشگاه"}
                      </p>
                      {address ? (
                        <p className="mt-1 whitespace-pre-line text-sm font-semibold leading-7 text-[var(--sf-ink)]">
                          {address}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  {hasMap ? (
                    <a
                      href={`https://www.google.com/maps?q=${contact.latitude},${contact.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 flex h-11 items-center justify-center gap-2 rounded-2xl bg-[var(--sf-ink)] text-sm font-semibold text-white transition active:scale-[0.98]"
                    >
                      <Navigation className="size-4" aria-hidden="true" />
                      مسیریابی روی نقشه
                    </a>
                  ) : null}
                </section>
              ) : null}

              {/* ۲ و ۳) تلفن‌ها */}
              {phones.length > 0 ? (
                <div
                  className={`grid gap-3 ${phones.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}
                >
                  {phones.map((p) => (
                    <a
                      key={p.key}
                      href={toTelHref(p.value)}
                      className={`sf-fade-up group block p-4 transition active:scale-[0.98] ${cardBase}`}
                      style={enter()}
                    >
                      <IconTile
                        icon={Phone}
                        gradient="linear-gradient(145deg, #34d399, #059669)"
                        glow="rgba(5, 150, 105, 0.45)"
                      />
                      <p className="mt-3 text-xs font-medium text-[var(--sf-ink)]/50">
                        {p.label}
                      </p>
                      <span
                        dir="ltr"
                        className="mt-1 block text-right text-[15px] font-bold tabular-nums tracking-wide text-[var(--sf-ink)]"
                      >
                        {p.value}
                      </span>
                      <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                        <PhoneCall className="size-3.5" aria-hidden="true" />
                        تماس بگیرید
                      </span>
                    </a>
                  ))}
                </div>
              ) : null}

              {/* ۴) ایمیل */}
              {email ? (
                <a
                  href={`mailto:${email}`}
                  className={`sf-fade-up group flex items-center gap-3 p-4 transition active:scale-[0.98] ${cardBase}`}
                  style={enter()}
                >
                  <IconTile
                    icon={Mail}
                    gradient="linear-gradient(145deg, #6cb4f5, #2f7fd6)"
                    glow="rgba(73, 155, 237, 0.5)"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-[var(--sf-ink)]/50">آدرس ایمیل</p>
                    <span
                      dir="ltr"
                      className="mt-1 block break-all text-right text-sm font-semibold text-[var(--sf-ink)]"
                    >
                      {email}
                    </span>
                  </div>
                  <ChevronLeft
                    className="size-5 shrink-0 text-[var(--sf-ink)]/25 transition group-active:-translate-x-0.5"
                    aria-hidden="true"
                  />
                </a>
              ) : null}

              {/* ۵) شبکه‌های اجتماعی و پیام‌رسان‌ها */}
              {channels.length > 0 ? (
                <section className="sf-fade-up pt-3" style={enter()}>
                  <div className="mb-3 flex items-center gap-2 px-1">
                    <span className="h-4 w-1 rounded-full bg-[var(--sf-accent)]" />
                    <h2 className="text-sm font-bold text-[var(--sf-ink)]">
                      ارتباط از طریق شبکه‌های اجتماعی و پیام‌رسان‌ها
                    </h2>
                  </div>
                  <div className="mx-auto flex max-w-[17rem] flex-wrap items-start justify-center gap-x-4 gap-y-4 sm:max-w-none">
                    {channels.map((ch) => {
                      const Icon = ch.icon;
                      return (
                        <a
                          key={ch.key}
                          href={ch.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={ch.label}
                          className="group flex w-16 flex-col items-center gap-1.5"
                        >
                          <span
                            className="flex size-11 items-center justify-center rounded-full text-white transition duration-200 group-hover:-translate-y-0.5 group-active:scale-90"
                            style={{
                              backgroundImage: ch.tile,
                              boxShadow: `0 8px 16px -8px ${ch.glow}`,
                            }}
                          >
                            <Icon className="size-5" />
                          </span>
                          <span className="text-[11px] font-medium text-[var(--sf-ink)]/70">
                            {ch.label}
                          </span>
                        </a>
                      );
                    })}
                  </div>
                </section>
              ) : null}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
