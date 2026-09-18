import { redirect } from "next/navigation";
import Link from "next/link";
import { Gift, Lock, Clock, UserCheck, Users, ShoppingBag, Ticket } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/current-user";
import { connectToDatabase } from "@/lib/db/connect";
import { getReferralSettings } from "@/models/ReferralSettings";
import { getReferralPageData, type ReferralInviteeSummary } from "@/lib/storefront/get-referral-summary";
import { env } from "@/config/env";
import { PageHeader } from "@/components/storefront/page-header";
import { ReferralCodeCard } from "@/components/storefront/referral-code-card";

/**
 * صفحهٔ «دعوت دوستان» Storefront — طبق درخواست صریح کارفرما و رفرنس
 * بصری ایشان (فقط برای ساختار Layout استفاده شد، نه رنگ/سبک —
 * هم‌الگو با یادداشت مشابه دربارهٔ رفرنس‌های persboy.ir؛ گرادیان
 * بنفش رفرنس با `--sf-accent` آبی/نیوی خودمان جایگزین شد).
 *
 * **منطق کسب‌وکار (طبق درخواست دقیق کارفرما):**
 * - کد رفرال هر کاربر فقط بعد از تکمیل *اولین خرید خودش* فعال
 *   می‌شود (`User.referralCode` قبل از آن اصلاً وجود ندارد — نگاه
 *   کنید `processReferralEventsAfterOrder`).
 * - وقتی یکی از دعوت‌شده‌ها *هم* اولین خرید خودش را کامل کند (و طبق
 *   تنظیمات Dashboard واجد شرایط باشد)، یک کد تخفیف پاداش برای
 *   دعوت‌کننده صادر می‌شود.
 * - سقف تعداد دعوت هر نفر و مقدار/درصد و حداقل مبلغ خرید، همگی از
 *   `/dashboard/settings/referral` قابل تنظیم‌اند.
 */
export default async function ReferralPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?redirect=/account/referral");
  }

  await connectToDatabase();
  const settings = await getReferralSettings();

  if (!settings.enabled) {
    return (
      <div>
        <PageHeader title="دعوت دوستان" />
        <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-gray-100 text-gray-400">
            <Gift className="size-6" strokeWidth={1.75} aria-hidden="true" />
          </span>
          <p className="text-sm font-medium text-[var(--sf-ink)]">
            این قابلیت فعلاً در دسترس نیست
          </p>
        </div>
      </div>
    );
  }

  const data = await getReferralPageData(user.id, user.referralCode ?? null);
  const inviteUrl = data.referralCode
    ? new URL(`/r/${data.referralCode}`, env.NEXT_PUBLIC_APP_URL).toString()
    : null;

  return (
    <div>
      <PageHeader title="دعوت دوستان" />

      <div className="space-y-5 px-4 py-4 sm:px-6">
        {/* بنر معرفی */}
        <section className="rounded-[var(--radius-lg)] bg-gradient-to-br from-[var(--sf-accent)] to-[var(--sf-ink-soft)] p-6 text-center text-white">
          <span className="mx-auto mb-3 flex size-14 items-center justify-center rounded-[var(--radius-md)] bg-white/15">
            <Gift className="size-7" strokeWidth={1.75} aria-hidden="true" />
          </span>
          <h2 className="text-lg font-bold">دوستاتو دعوت کن، هدیه بگیر!</h2>
          <p className="mt-2 text-sm text-white/85">
            به‌ازای هر دوستی که با کد شما ثبت‌نام کند و اولین خرید خود را
            انجام دهد، یک کد تخفیف هدیه دریافت می‌کنید.
          </p>
        </section>

        {/* کد رفرال — فعال یا قفل */}
        {data.referralCode && inviteUrl ? (
          <ReferralCodeCard code={data.referralCode} inviteUrl={inviteUrl} />
        ) : (
          <section className="flex flex-col items-center gap-3 rounded-[var(--radius-lg)] border border-dashed border-black/10 bg-white px-6 py-10 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-amber-50 text-amber-500">
              <Lock className="size-5" strokeWidth={1.75} aria-hidden="true" />
            </span>
            <p className="text-sm font-bold text-[var(--sf-ink)]">
              کد و لینک دعوت هنوز فعال نشده
            </p>
            <p className="text-xs text-[var(--sf-ink)]/60">
              برای دریافت کد و لینک دعوت اختصاصی، ابتدا اولین خرید خودتان
              را تکمیل کنید.
            </p>
            <Link
              href="/"
              className="mt-1 flex items-center gap-2 rounded-full bg-[var(--sf-accent)] px-5 py-2.5 text-sm font-bold text-white active:bg-[var(--sf-accent-hover)]"
            >
              <ShoppingBag className="size-4" strokeWidth={2} aria-hidden="true" />
              شروع خرید
            </Link>
          </section>
        )}

        {/* آمار */}
        <section className="grid grid-cols-3 gap-2">
          <StatCard icon={Clock} iconClassName="text-amber-500" label="در انتظار خرید" value={data.pendingCount} />
          <StatCard icon={UserCheck} iconClassName="text-emerald-600" label="پاداش دریافتی" value={data.rewardedCount} />
          <StatCard icon={Users} iconClassName="text-blue-600" label="کل دعوت‌شده‌ها" value={data.totalCount} />
        </section>

        {/* کدهای تخفیف پاداش فعال */}
        {data.activeRewardCoupons.length > 0 && (
          <section>
            <h2 className="mb-2 px-1 text-xs font-bold text-[var(--sf-ink)]/50">
              کدهای تخفیف پاداش شما
            </h2>
            <div className="flex flex-col gap-2">
              {data.activeRewardCoupons.map((coupon) => (
                <div
                  key={coupon.code}
                  className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-black/5 bg-white p-3"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-emerald-50 text-emerald-600">
                    <Ticket className="size-4" strokeWidth={1.75} aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p dir="ltr" className="text-right text-sm font-bold tracking-wider text-[var(--sf-ink)]">
                      {coupon.code}
                    </p>
                    <p className="text-xs text-[var(--sf-ink)]/50">
                      {coupon.discountPercentage.toLocaleString("fa-IR")}٪ تخفیف
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* زیرمجموعه‌ها */}
        <section>
          <h2 className="mb-2 px-1 text-xs font-bold text-[var(--sf-ink)]/50">
            زیرمجموعه‌های شما
          </h2>
          {data.invitees.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-[var(--radius-lg)] border border-black/5 bg-white px-6 py-10 text-center">
              <span className="text-2xl" aria-hidden="true">
                🎁
              </span>
              <p className="text-sm text-[var(--sf-ink)]/60">
                هنوز کسی با کد شما ثبت‌نام نکرده
              </p>
            </div>
          ) : (
            <div className="divide-y divide-black/5 overflow-hidden rounded-[var(--radius-lg)] border border-black/5 bg-white">
              {data.invitees.map((invitee) => (
                <InviteeRow key={invitee.id} invitee={invitee} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  iconClassName,
  label,
  value,
}: {
  icon: typeof Clock;
  iconClassName: string;
  label: string;
  value: number;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5 rounded-[var(--radius-lg)] border border-black/5 bg-white py-4">
      <Icon className={`size-5 ${iconClassName}`} strokeWidth={1.75} aria-hidden="true" />
      <span className="text-base font-bold text-[var(--sf-ink)]">
        {value.toLocaleString("fa-IR")}
      </span>
      <span className="text-[11px] text-[var(--sf-ink)]/50">{label}</span>
    </div>
  );
}

const STATUS_LABELS: Record<ReferralInviteeSummary["status"], { text: string; className: string }> = {
  pending: { text: "در انتظار خرید", className: "bg-amber-50 text-amber-600" },
  rewarded: { text: "پاداش دریافت شد", className: "bg-emerald-50 text-emerald-600" },
  ineligible: { text: "واجد شرایط نبود", className: "bg-gray-100 text-gray-500" },
};

function InviteeRow({ invitee }: { invitee: ReferralInviteeSummary }) {
  const status = STATUS_LABELS[invitee.status];
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-500">
        {invitee.displayName.slice(0, 2)}
      </span>
      <p className="min-w-0 flex-1 truncate text-sm text-[var(--sf-ink)]">{invitee.displayName}</p>
      <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium ${status.className}`}>
        {status.text}
      </span>
    </div>
  );
}
