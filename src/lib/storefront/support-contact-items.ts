import type { ComponentType } from "react";
import { Headphones, Phone } from "lucide-react";
import { EitaaIcon, RubikaIcon, TelegramIcon, WhatsappIcon } from "@/components/storefront/social-icons";

export interface SupportContactData {
  phone: string;
  supportAdminLink: string;
  telegramLink: string;
  whatsappLink: string;
  rubikaLink: string;
  eitaaLink: string;
}

export type SupportContactItem = {
  key: string;
  title: string;
  description: string;
  href: string;
  external: boolean;
  icon: ComponentType<{ className?: string }>;
  /**
   * رنگ اختصاصی هر پیام‌رسان («کد رنگ سازمانی خودشون» طبق درخواست
   * صریح کارفرما) — تلگرام/واتساپ رنگ رسمی برند خودشان هستند.
   * روبیکا/ایتا چون هنوز رنگ رسمی تأییدشده‌ای در پروژه نداریم
   * (نگاه کنید توضیح `RubikaIcon` در social-icons.tsx)، نزدیک‌ترین
   * رنگ شناخته‌شدهٔ هرکدام تقریبی انتخاب شده — اگر بعداً رنگ رسمی
   * از طرف کارفرما مشخص شد، فقط همین دو مقدار باید عوض شوند.
   */
  color: string;
};

/**
 * فهرست راه‌های تماس سریع (تلفن + چت پشتیبانی + پیام‌رسان‌ها) را از
 * روی «تنظیمات ← تماس با ما» می‌سازد. قبلاً این منطق فقط داخل
 * `support-popup.tsx` (Dropdown آیکون هدست در Top Bar) بود؛ چون صفحه
 * «تماس با ما» هم دقیقاً همین فهرست را (با همان آیکون/رنگ هر
 * پیام‌رسان) نیاز داشت، به این فایل مشترک منتقل شد تا از ساخت یک
 * نسخه Duplicate جلوگیری شود. رفتار/خروجی این تابع عیناً همان قبلی
 * است — فقط محل تعریف تغییر کرده.
 */
export function buildSupportContactItems(data: SupportContactData): SupportContactItem[] {
  const items: SupportContactItem[] = [];

  if (data.phone.trim()) {
    items.push({
      key: "phone",
      title: "تماس تلفنی",
      description: data.phone,
      href: `tel:${data.phone.trim()}`,
      external: false,
      icon: Phone,
      color: "#16a34a",
    });
  }
  if (data.supportAdminLink.trim()) {
    items.push({
      key: "admin",
      title: "گفتگو با پشتیبانی",
      description: "چت مستقیم با ادمین فروشگاه",
      href: data.supportAdminLink.trim(),
      external: true,
      icon: Headphones,
      color: "var(--color-primary)",
    });
  }
  if (data.telegramLink.trim()) {
    items.push({
      key: "telegram",
      title: "تلگرام",
      description: "پیام در تلگرام",
      href: data.telegramLink.trim(),
      external: true,
      icon: TelegramIcon,
      color: "#26A5E4",
    });
  }
  if (data.whatsappLink.trim()) {
    items.push({
      key: "whatsapp",
      title: "واتساپ",
      description: "پیام در واتساپ",
      href: data.whatsappLink.trim(),
      external: true,
      icon: WhatsappIcon,
      color: "#25D366",
    });
  }
  if (data.rubikaLink.trim()) {
    items.push({
      key: "rubika",
      title: "روبیکا",
      description: "پیام در روبیکا",
      href: data.rubikaLink.trim(),
      external: true,
      icon: RubikaIcon,
      color: "#F4574B",
    });
  }
  if (data.eitaaLink.trim()) {
    items.push({
      key: "eitaa",
      title: "ایتا",
      description: "پیام در ایتا",
      href: data.eitaaLink.trim(),
      external: true,
      icon: EitaaIcon,
      color: "#1E88E5",
    });
  }

  return items;
}
