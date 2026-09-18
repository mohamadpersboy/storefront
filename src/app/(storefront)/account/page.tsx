import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Package,
  Ticket,
  Wallet as WalletIcon,
  MapPin,
  CreditCard,
  Pencil,
  Gift,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth/current-user";
import { connectToDatabase } from "@/lib/db/connect";
import { Order } from "@/models/Order";
import { Wallet } from "@/models/Wallet";
import { CouponRedemption } from "@/models/CouponRedemption";
import { WithdrawalRequest } from "@/models/WithdrawalRequest";
import { Address } from "@/models/Address";
import { CustomerBankAccount } from "@/models/CustomerBankAccount";
import { Referral } from "@/models/Referral";
import { getReferralSettings } from "@/models/ReferralSettings";
import { ROLE_LABELS } from "@/lib/constants/role-labels";
import { formatTomanGlyph } from "@/lib/utils/format";
import { PageHeader } from "@/components/storefront/page-header";
import { AccountNavRow } from "@/components/storefront/account-nav-row";
import { AccountLogoutButton } from "@/components/storefront/account-logout-button";

/**
 * صفحه «حساب من» Storefront.
 *
 * این صفحه همیشه Auth می‌خواهد (برخلاف صفحه اصلی که برای همه باز
 * است) — دقیقاً هم‌الگو با مرز Authorization واقعی در
 * `(dashboard)/dashboard/layout.tsx`: `getCurrentUser()` مستقیم چک
 * می‌شود، نه فقط یک Middleware/proxy خوش‌بینانه.
 *
 * **«آدرس‌های من» و «اطلاعات بانکی»** ابتدا در نسخه اول این صفحه
 * عمداً حذف شده بودند چون پشت هیچ Model واقعی نبودند؛ حالا هر دو
 * یک Model/API مستقل خودشان را دارند (`models/Address.ts` و
 * `models/CustomerBankAccount.ts` — دلیل طراحی هرکدام داخل همان
 * فایل‌ها مستند شده) و اینجا هم به داده واقعی وصل‌اند، نه Mock.
 *
 * **بنر دعوت‌دوستان** اکنون اضافه شده (`/account/referral`) — سیستم
 * Referral کامل (کد دعوت فعال بعد از اولین خرید، پاداش بعد از
 * اولین خرید دعوت‌شده، تنظیمات در Dashboard) ساخته شد؛ نگاه کنید
 * `src/models/Referral.ts`/`ReferralSettings.ts`. این ردیف فقط وقتی
 * `ReferralSettings.enabled` باشد نمایش داده می‌شود — هم‌الگو با
 * اصل «FreeShippingBanner فقط وقتی فعال است دیده می‌شود».
 *
 * هیچ Badge با عدد ساختگی نمایش داده نمی‌شود — طبق همان اصل
 * رعایت‌شده در Bottom Bar (شمارنده سبد خرید صفر واقعی): وقتی عددی
 * معنا ندارد یا صفر است (مثلاً درخواست برداشت در انتظار)، Badge اصلاً
 * پاس داده نمی‌شود.
 *
 * لینک مقصد `/orders` و `/account/coupons` هنوز صفحه ندارند —
 * دقیقاً هم‌الگو با `/search`/`/notifications`/`/support` در Top
 * Bar: لینک از قبل درست ساخته می‌شود، خود صفحه مقصد در ماژول بعدی
 * اضافه خواهد شد. `/account/addresses`، `/account/bank-info`، و
 * `/account/wallet` (با شارژ/درخواست تسویه) برخلاف آن‌ها، ساخته
 * شده‌اند.
 */
export default async function AccountPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?redirect=/account");
  }

  await connectToDatabase();

  const [
    ordersCount,
    wallet,
    usedCouponsCount,
    pendingWithdrawalsCount,
    addressesCount,
    bankAccount,
    referralSettings,
    referralRewardedCount,
  ] = await Promise.all([
    Order.countDocuments({ customer: user._id }),
    Wallet.findOne({ user: user._id }).lean(),
    CouponRedemption.countDocuments({ user: user._id }),
    WithdrawalRequest.countDocuments({ user: user._id, status: "pending" }),
    Address.countDocuments({ user: user._id }),
    CustomerBankAccount.findOne({ user: user._id }).lean(),
    getReferralSettings().catch(() => null),
    Referral.countDocuments({ referrer: user._id, status: "rewarded" }).catch(() => 0),
  ]);

  const displayName = user.fullName || user.phoneNumber;
  const initials = displayName.slice(0, 2);
  const showRoleBadge = user.role !== "customer";
  const walletBalance = wallet?.balance ?? 0;

  return (
    <div>
      <PageHeader title="حساب من" />

      <div className="space-y-6 px-4 py-4 sm:px-6">
        {/* پروفایل */}
        <section className="relative rounded-[var(--radius-lg)] border border-black/5 bg-white p-4">
          <Link
            href="/account/edit-profile"
            aria-label="ویرایش اطلاعات کاربری"
            className="absolute left-3 top-3 flex size-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 active:bg-gray-200"
          >
            <Pencil className="size-3.5" strokeWidth={1.75} aria-hidden="true" />
          </Link>
          <div className="flex items-center gap-3">
            <span className="flex size-14 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary)] text-lg font-bold text-white">
              {initials}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-bold text-[var(--sf-ink)]">
                {displayName}
              </p>
              <p className="text-xs text-[var(--sf-ink)]/50">{user.phoneNumber}</p>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                {showRoleBadge && (
                  <span className="rounded-full bg-[var(--color-primary)]/10 px-2.5 py-0.5 text-[11px] font-medium text-[var(--color-primary)]">
                    {ROLE_LABELS[user.role]}
                  </span>
                )}
                <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-medium text-[var(--sf-ink)]/70">
                  {ordersCount.toLocaleString("fa-IR")} سفارش
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* خرید و سفارش‌ها */}
        <section>
          <h2 className="mb-2 px-1 text-xs font-bold text-[var(--sf-ink)]/50">
            خرید و سفارش‌ها
          </h2>
          <div className="divide-y divide-black/5 overflow-hidden rounded-[var(--radius-lg)] border border-black/5 bg-white">
            <AccountNavRow
              href="/orders"
              icon={Package}
              iconClassName="bg-blue-50 text-blue-600"
              title="سفارش‌های من"
              subtitle="پیگیری و تاریخچه سفارش‌ها"
              badge={ordersCount}
            />
            <AccountNavRow
              href="/account/coupons"
              icon={Ticket}
              iconClassName="bg-amber-50 text-amber-600"
              title="کدهای تخفیف من"
              subtitle="کدهای تخفیف استفاده‌شده"
              badge={usedCouponsCount}
            />
            <AccountNavRow
              href="/account/addresses"
              icon={MapPin}
              iconClassName="bg-teal-50 text-teal-600"
              title="آدرس‌های من"
              subtitle="مدیریت آدرس‌های تحویل"
              badge={addressesCount}
            />
            {referralSettings?.enabled && (
              <AccountNavRow
                href="/account/referral"
                icon={Gift}
                iconClassName="bg-pink-50 text-pink-600"
                title="دعوت دوستان"
                subtitle="دوستاتو دعوت کن، هدیه بگیر"
                badge={referralRewardedCount || undefined}
                badgeVariant="attention"
              />
            )}
          </div>
        </section>

        {/* مالی */}
        <section>
          <h2 className="mb-2 px-1 text-xs font-bold text-[var(--sf-ink)]/50">
            مالی
          </h2>
          <div className="divide-y divide-black/5 overflow-hidden rounded-[var(--radius-lg)] border border-black/5 bg-white">
            <AccountNavRow
              href="/account/wallet"
              icon={WalletIcon}
              iconClassName="bg-emerald-50 text-emerald-600"
              title="کیف پول من"
              subtitle={`موجودی: ${formatTomanGlyph(walletBalance)}`}
              badge={pendingWithdrawalsCount || undefined}
              badgeVariant="attention"
            />
            <AccountNavRow
              href="/account/bank-info"
              icon={CreditCard}
              iconClassName="bg-violet-50 text-violet-600"
              title="اطلاعات بانکی"
              subtitle={bankAccount ? "شماره کارت/شبا ثبت شده" : "هنوز ثبت نشده"}
            />
          </div>
        </section>

        <AccountLogoutButton />
      </div>
    </div>
  );
}
