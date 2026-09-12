import type { SVGProps } from "react";

/**
 * آیکون‌های شبکه‌های اجتماعی برای Footer. این‌ها بازسازی ساده‌شدهٔ
 * شکل کلی هر اپ هستند (خط‌کشی مینیمال، هم‌سبک با بقیهٔ آیکون‌های
 * پروژه از Lucide) نه کپی دقیق پیکسل‌به‌پیکسل لوگوی رسمی — چون
 * Lucide اصلاً برای Rubika/Eitaa (اپ‌های ایرانی) و اکثر شبکه‌های
 * اجتماعی دیگر آیکون ندارد. اگر بعداً کارفرما فایل SVG رسمی برند هر
 * پلتفرم را در اختیار گذاشت، جایگزین همین‌جا می‌شود.
 *
 * همه از `currentColor` استفاده می‌کنند تا رنگشان مثل بقیهٔ
 * آیکون‌های صفحه با کلاس Tailwind (`text-*`) قابل کنترل باشد.
 */

export function InstagramIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} {...props}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.2" cy="6.8" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function TelegramIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} {...props}>
      <path
        strokeLinejoin="round"
        strokeLinecap="round"
        d="M3.5 12.6 20 4.2l-3 15.6-5.3-4.1-2.6 2.5-.5-4.1Z"
      />
      <path strokeLinejoin="round" strokeLinecap="round" d="M9.6 14.2 20 4.2" />
    </svg>
  );
}

export function WhatsappIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} {...props}>
      <path d="M4.5 20 5.7 16A7.9 7.9 0 1 1 9 18.6L4.5 20Z" strokeLinejoin="round" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.2 8.8c.2-.5.5-.5.8-.5h.5c.2 0 .4 0 .6.4.2.5.6 1.4.6 1.5.1.1.1.3 0 .4-.1.2-.2.3-.3.4-.1.2-.3.3-.1.6.2.4.9 1.3 1.9 1.9.3.2.6.2.8 0 .2-.1.4-.4.6-.6.2-.2.3-.2.5-.1l1.3.6c.2.1.3.2.4.3.1.2.1.9-.2 1.3-.3.5-1.2.9-1.7.9-.5 0-1.1-.1-2.6-.9-2-1.1-3.3-3.2-3.4-3.4-.1-.1-.8-1.1-.8-2.1 0-1 .5-1.5.7-1.7Z"
      />
    </svg>
  );
}

/** بازسازی ساده‌شده (نه لوگوی رسمی) — رجوع کنید به کامنت بالای فایل. */
export function RubikaIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} {...props}>
      <path
        strokeLinejoin="round"
        d="M12 3.5c4.7 0 8.5 3.4 8.5 7.6 0 4.1-3.8 7.5-8.5 7.5-1 0-2-.2-2.9-.5l-3.8 1.4 1.1-3.4c-2-1.4-3.4-3.5-3.4-5.9 0-4.2 3.8-7.7 9-7.7Z"
      />
      <circle cx="9.2" cy="11.1" r="1" fill="currentColor" stroke="none" />
      <circle cx="12.9" cy="11.1" r="1" fill="currentColor" stroke="none" />
      <circle cx="16.6" cy="11.1" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** بازسازی ساده‌شده (نه لوگوی رسمی) — رجوع کنید به کامنت بالای فایل. */
export function EitaaIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} {...props}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="6" />
      <path strokeLinejoin="round" strokeLinecap="round" d="M8 12.8 11.3 15l4.7-6.3" />
    </svg>
  );
}
