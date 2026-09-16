"use client";

import { useEffect, useRef, useState } from "react";
import { Headphones, Phone } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { EitaaIcon, RubikaIcon, TelegramIcon, WhatsappIcon } from "@/components/storefront/social-icons";

export interface SupportContactData {
  phone: string;
  supportAdminLink: string;
  telegramLink: string;
  whatsappLink: string;
  rubikaLink: string;
  eitaaLink: string;
}

type SupportItem = {
  key: string;
  title: string;
  description: string;
  href: string;
  external: boolean;
  icon: React.ComponentType<{ className?: string }>;
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

function buildItems(data: SupportContactData): SupportItem[] {
  const items: SupportItem[] = [];

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

/**
 * دکمه پشتیبانی + پاپ‌آپ — هم‌الگو با `NotificationBell` (بستن با
 * کلیک بیرون/Escape، همان شل بصری Card/فلش/موقعیت‌دهی Fixed)، اما
 * به‌جای فهرست اعلان، فهرست راه‌های تماس (تلفن + لینک ادمین
 * پشتیبانی + پیام‌رسان‌هایی که کارفرما در «تنظیمات ← تماس با ما»
 * پر کرده) را نشان می‌دهد — هر ردیف با آیکون رنگی (رنگ رسمی/تقریبیِ
 * همان پیام‌رسان) + عنوان + توضیح، نه فقط یک آیکون تنها.
 *
 * موقعیت فلش: Support سومین (آخرین) دکمه در گروه آیکون‌های Top Bar
 * است، یعنی یک عرض دکمه + Gap (۴۴+۸=۵۲px) از فلش Bell
 * (`left: 66`، نگاه کنید `notification-bell.tsx`) به سمت لبه چپ
 * فاصله دارد → `left: 66 - 52 = 14`.
 */
export function SupportPopup({ support }: { support: SupportContactData }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const items = buildItems(support);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="پشتیبانی"
        aria-haspopup="true"
        aria-expanded={open}
        className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-gray-400 active:bg-gray-200"
      >
        <Headphones className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="پشتیبانی"
          className="fixed left-4 z-50 w-[min(340px,calc(100vw-32px))] overflow-visible rounded-2xl border border-black/5 bg-white shadow-[0_16px_40px_rgba(3,23,37,0.18)]"
          style={{ top: "calc(env(safe-area-inset-top) + 68px)" }}
        >
          <span
            aria-hidden="true"
            className="absolute -top-2 h-0 w-0 border-x-8 border-b-8 border-x-transparent border-b-white"
            style={{ left: 14 }}
          />

          <div className="overflow-hidden rounded-2xl">
            <div className="border-b border-black/5 px-4 py-3">
              <p className="text-sm font-semibold text-[var(--sf-ink)]">ارتباط با پشتیبانی</p>
            </div>

            {items.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
                <Headphones className="h-8 w-8 text-gray-300" strokeWidth={1.5} aria-hidden="true" />
                <p className="text-sm text-gray-400">راه ارتباطی ثبت نشده است</p>
              </div>
            ) : (
              <ul className="max-h-[60vh] overflow-y-auto">
                {items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.key} className="border-b border-black/5 last:border-b-0">
                      <a
                        href={item.href}
                        onClick={() => setOpen(false)}
                        {...(item.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                        className={cn(
                          "flex items-center gap-3 px-4 py-3 transition-colors hover:bg-gray-50 active:bg-gray-100",
                        )}
                      >
                        <span
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                          style={{ backgroundColor: `${item.color}1a`, color: item.color }}
                        >
                          <Icon className="h-4.5 w-4.5" aria-hidden="true" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-[var(--sf-ink)]">{item.title}</p>
                          <p
                            dir={item.key === "phone" ? "ltr" : undefined}
                            className={cn(
                              "mt-0.5 truncate text-xs text-gray-500",
                              item.key === "phone" && "text-right",
                            )}
                          >
                            {item.description}
                          </p>
                        </div>
                      </a>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
