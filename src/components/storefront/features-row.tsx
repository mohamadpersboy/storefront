import { Headphones, ShieldCheck, Truck, Wallet } from "lucide-react";

const FEATURES = [
  { icon: Headphones, title: "پشتیبانی", subtitle: "پاسخگوی شما" },
  { icon: Wallet, title: "پرداخت در محل", subtitle: "نقدی یا کارت" },
  { icon: ShieldCheck, title: "ضمانت اصالت", subtitle: "فرش ۱۰۰٪ اصل" },
  { icon: Truck, title: "ارسال سراسری", subtitle: "بسته‌بندی ایمن" },
];

/**
 * ردیف ویژگی‌های فروشگاه (پشتیبانی/پرداخت در محل/ضمانت اصالت/ارسال
 * سراسری). محتوای این چهار مورد Static است، نه از یک Model پویا —
 * مثل بقیهٔ متن‌های ثابت صفحه (Design Principles و امثال آن)، نه
 * چیزی که در Dashboard مدیریت شود. رنگ آیکون‌ها عمداً همان آبی
 * برند اصلی پروژه است (`--sf-accent`)، نه سبز رفرنس بصری کارفرما —
 * آن رفرنس فقط برای الگوی چیدمان بود، نه پالت رنگ.
 *
 * طبق دستور صریح کارفرما، سایز فونت‌ها عمداً کوچک نگه داشته شده
 * (نه بزرگ‌تر از رفرنس)، هم‌مقیاس با بقیهٔ صفحه.
 */
export function FeaturesRow() {
  return (
    <section className="pt-6 px-4 sm:px-6">
      <div className="grid grid-cols-4 gap-2">
        {FEATURES.map(({ icon: Icon, title, subtitle }) => (
          <div key={title} className="flex flex-col items-center text-center">
            <span className="flex size-14 items-center justify-center rounded-full bg-[var(--sf-accent-soft)]">
              <Icon className="size-6 text-[var(--sf-accent)]" />
            </span>
            <p className="mt-2 text-xs font-bold text-[var(--sf-ink)]">{title}</p>
            <p className="text-[11px] text-[var(--sf-ink)]/50">{subtitle}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
