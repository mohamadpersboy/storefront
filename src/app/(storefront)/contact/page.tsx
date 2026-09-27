import { Clock, Mail, MapPin, MessageCircle, Navigation, Phone } from "lucide-react";
import { connectToDatabase } from "@/lib/db/connect";
import { getContactUs } from "@/models/ContactUs";
import { PageHeader } from "@/components/storefront/page-header";
import { EmptyState } from "@/components/storefront/empty-state";
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
};

async function getContactUsSafe(): Promise<ContactUsData> {
  try {
    await connectToDatabase();
    const doc = await getContactUs();
    return {
      phone: doc.phone,
      secondaryPhone: doc.secondaryPhone,
      email: doc.email,
      address: doc.address,
      workingHours: doc.workingHours,
      latitude: doc.latitude,
      longitude: doc.longitude,
      supportAdminLink: doc.supportAdminLink,
      telegramLink: doc.telegramLink,
      whatsappLink: doc.whatsappLink,
      rubikaLink: doc.rubikaLink,
      eitaaLink: doc.eitaaLink,
    };
  } catch {
    // اگر DB در دسترس نبود، صفحه نباید خراب شود — همان Empty State
    // «هنوز راه ارتباطی ثبت نشده» نمایش داده می‌شود (هم‌الگو با
    // `getActiveBanners()` در صفحه اصلی).
    return EMPTY_CONTACT;
  }
}

type ContactRow = {
  key: string;
  title: string;
  description: string;
  href: string | null;
  external: boolean;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
};

/**
 * چهار ردیف اطلاعاتی (تلفن دوم/ایمیل/آدرس/ساعات کاری) که در
 * `buildSupportContactItems` نیستند — آن تابع فقط راه‌های ارتباط
 * سریع (تلفن اصلی + پیام‌رسان‌ها، همان چیزی که Popup هدست هم نشان
 * می‌دهد) را می‌سازد. این‌جا چون صفحه کامل «تماس با ما»ست، این
 * فیلدهای اضافی مدل `ContactUs` هم لازم است دیده شوند.
 *
 * ردیف «مسیر یابی روی نقشه» فقط وقتی اضافه می‌شود که هر دو
 * `latitude`/`longitude` ثبت شده باشند؛ یک لینک ساده به Google Maps
 * است، نه یک نقشه Embed شده — تا وقتی معماری Neshan (کلید API،
 * Client/Server) مشخص و تأیید نشده، به این نقشه‌ساده‌ی بدون نیاز به
 * کلید بسنده شده.
 */
function buildExtraRows(data: ContactUsData): ContactRow[] {
  const rows: ContactRow[] = [];

  if (data.secondaryPhone.trim()) {
    rows.push({
      key: "secondary-phone",
      title: "تلفن دوم",
      description: data.secondaryPhone,
      href: `tel:${data.secondaryPhone.trim()}`,
      external: false,
      icon: Phone,
      color: "#16a34a",
    });
  }
  if (data.email.trim()) {
    rows.push({
      key: "email",
      title: "ایمیل",
      description: data.email,
      href: `mailto:${data.email.trim()}`,
      external: false,
      icon: Mail,
      color: "var(--sf-accent)",
    });
  }
  if (data.address.trim()) {
    rows.push({
      key: "address",
      title: "آدرس",
      description: data.address,
      href: null,
      external: false,
      icon: MapPin,
      color: "var(--sf-accent)",
    });
  }
  if (data.latitude !== null && data.longitude !== null) {
    rows.push({
      key: "map",
      title: "مسیر یابی روی نقشه",
      description: "نمایش موقعیت فروشگاه در Google Maps",
      href: `https://www.google.com/maps?q=${data.latitude},${data.longitude}`,
      external: true,
      icon: Navigation,
      color: "var(--sf-accent)",
    });
  }
  if (data.workingHours.trim()) {
    rows.push({
      key: "hours",
      title: "ساعات کاری",
      description: data.workingHours,
      href: null,
      external: false,
      icon: Clock,
      color: "#a16207",
    });
  }

  return rows;
}

function ContactRowView({ row }: { row: ContactRow }) {
  const Icon = row.icon;
  const inner = (
    <>
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
        style={{ backgroundColor: `${row.color}1a`, color: row.color }}
      >
        <Icon className="h-4.5 w-4.5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-[var(--sf-ink)]">{row.title}</p>
        <p className="mt-0.5 whitespace-pre-line text-xs leading-5 text-gray-500">
          {row.description}
        </p>
      </div>
    </>
  );

  if (!row.href) {
    return <div className="flex items-center gap-3 px-4 py-3">{inner}</div>;
  }

  return (
    <a
      href={row.href}
      {...(row.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-gray-50 active:bg-gray-100"
    >
      {inner}
    </a>
  );
}

/**
 * صفحه «تماس با ما» — مصرف‌کننده مستقیم مدل `ContactUs` (بدون
 * Round-trip به `GET /api/v1/contact-us`، همان الگوی بقیه صفحات
 * اصلی Storefront). راه‌های ارتباط سریع (تلفن/چت‌ پشتیبانی/
 * پیام‌رسان‌ها) از همان `buildSupportContactItems` می‌آید که
 * `SupportPopup` (آیکون هدست در Top Bar) هم استفاده می‌کند — یک
 * منبع مشترک، نه یک نسخه Duplicate.
 */
export default async function ContactPage() {
  const contact = await getContactUsSafe();

  const channelRows = buildSupportContactItems(contact);
  const extraRows = buildExtraRows(contact);
  const rows: ContactRow[] = [...channelRows, ...extraRows];

  return (
    <div>
      <PageHeader title="تماس با ما" />

      <div className="px-4 py-4 sm:mx-auto sm:max-w-2xl sm:px-6">
        {rows.length === 0 ? (
          <EmptyState
            icon={MessageCircle}
            title="هنوز راه ارتباطی ثبت نشده"
            description="به‌زودی راه‌های تماس با فروشگاه این‌جا نمایش داده می‌شود."
            actionLabel="بازگشت به صفحه اصلی"
            actionHref="/"
          />
        ) : (
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
            {rows.map((row, rowIndex) => (
              <div
                key={row.key}
                className={rowIndex > 0 ? "border-t border-black/5" : undefined}
              >
                <ContactRowView row={row} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
