import Link from "next/link";
import {
  Palette,
  BadgePercent,
  History,
  Share2,
  MapPin,
  ChevronLeft,
  Info,
  Phone,
  HelpCircle,
  Landmark,
  CreditCard,
  Terminal,
  GalleryHorizontal,
} from "lucide-react";
import { Card } from "@/components/ui/card";

const settingsSections = [
  {
    href: "/dashboard/settings/banners",
    icon: GalleryHorizontal,
    title: "اسلایدر صفحه اصلی",
    description: "مدیریت بنرهای Hero Slider صفحه اصلی فروشگاه",
  },
  {
    href: "/dashboard/settings/colors",
    icon: Palette,
    title: "رنگ‌ها",
    description: "مدیریت رنگ‌های قابل انتخاب برای Variant محصولات",
  },
  {
    href: "/dashboard/settings/about-us",
    icon: Info,
    title: "درباره ما",
    description: "محتوای صفحه «درباره ما»ی فروشگاه",
  },
  {
    href: "/dashboard/settings/contact-us",
    icon: Phone,
    title: "تماس با ما",
    description: "تلفن، ایمیل، آدرس و موقعیت فروشگاه",
  },
  {
    href: "/dashboard/settings/faq",
    icon: HelpCircle,
    title: "سوالات متداول",
    description: "مدیریت سوالات و پاسخ‌های پرتکرار مشتریان",
  },
  {
    href: "/dashboard/settings/social-links",
    icon: Share2,
    title: "شبکه‌های اجتماعی",
    description: "لینک اینستاگرام، تلگرام، واتساپ، روبیکا و ایتا برای فوتر فروشگاه",
  },
  {
    href: "/dashboard/settings/provinces-cities",
    icon: MapPin,
    title: "استان‌ها و شهرها",
    description: "Import از Excel — منبع Dropdown آدرس در فرم‌های مختلف",
  },
  {
    href: "/dashboard/settings/banks",
    icon: Landmark,
    title: "بانک‌ها",
    description: "مدیریت بانک‌های قابل انتخاب برای ثبت چک‌های دریافتی",
  },
  {
    href: "/dashboard/settings/card-accounts",
    icon: CreditCard,
    title: "کارت‌ها و حساب‌های بانکی",
    description: "حساب‌های مقصد فروشگاه برای دریافت کارت‌به‌کارت",
  },
  {
    href: "/dashboard/settings/pos-terminals",
    icon: Terminal,
    title: "کارتخوان‌ها",
    description: "کارتخوان‌های فروشگاه برای ثبت پرداخت‌های حضوری",
  },
  {
    href: "/dashboard/settings/discounts",
    icon: BadgePercent,
    title: "تخفیف خودکار پرداخت",
    description: "پاداش پرداخت کامل اینترنتی و پرداخت ترکیبی",
  },
  {
    href: "/dashboard/settings/activity-log",
    icon: History,
    title: "تاریخچه فعالیت‌ها",
    description: "چه کسی، چه تغییر حساسی را کِی انجام داده",
  },
];

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <ul className="divide-y divide-border">
          {settingsSections.map((section) => {
            const Icon = section.icon;
            return (
              <li key={section.href}>
                <Link
                  href={section.href}
                  className="flex items-center gap-3 px-5 py-4 hover:bg-surface-subtle"
                >
                  <span className="flex size-9 items-center justify-center rounded-[var(--radius-md)] bg-primary-soft text-primary">
                    <Icon className="size-4" strokeWidth={1.75} />
                  </span>
                  <span className="flex-1">
                    <span className="block text-sm font-medium text-foreground">
                      {section.title}
                    </span>
                    <span className="block text-xs text-muted">
                      {section.description}
                    </span>
                  </span>
                  <ChevronLeft className="size-4 text-muted" />
                </Link>
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}
