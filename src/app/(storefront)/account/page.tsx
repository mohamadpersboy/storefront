import { redirect } from "next/navigation";
import {
  Package,
  Ticket,
  Wallet as WalletIcon,
  RefreshCcw,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth/current-user";
import { connectToDatabase } from "@/lib/db/connect";
import { Order } from "@/models/Order";
import { Wallet } from "@/models/Wallet";
import { CouponRedemption } from "@/models/CouponRedemption";
import { WithdrawalRequest } from "@/models/WithdrawalRequest";
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
 * **چرا فقط این ۴ ردیف؟** رفرنس بصری کارفرما («حساب من» یک اپ
 * مالی) شامل «آدرس‌های من»، «اطلاعات بانکی»، و یک بنر دعوت‌دوستان
 * هم بود، اما این سه مورد فعلاً پشت هیچ قابلیت واقعی در Backend
 * نیستند:
 *  - Address Book مستقل مشتری هنوز طراحی نشده (طبق CLAUDE.md، بخش
 *    «Known Limitations» — فقط `Order.shippingAddress` Embedded
 *    وجود دارد، نه چند آدرس ذخیره‌شده per کاربر).
 *  - «اطلاعات بانکی» به‌عنوان یک پروفایل دائمی کارت/شبا برای کاربر
 *    ذخیره نمی‌شود؛ شماره کارت/شبا فقط per-درخواست داخل خود
 *    `WithdrawalRequest.destination` گرفته می‌شود.
 *  - سیستم دعوت‌دوستان/Referral اصلاً در پروژه وجود ندارد.
 * ساختن هرکدام از این‌ها یک Model/API جدید و یک تصمیم معماری
 * جداست — طبق قانون پروژه («قبل از تغییر معماری گسترده اجازه
 * بگیر») این‌ها را نساختم؛ در پیام بعدی گزارش می‌دهم تا خودتان
 * تصمیم بگیرید کدام‌یک ماژول بعدی باشد.
 *
 * چهار ردیفی که نگه داشته شد، همه پشت داده/Model واقعی موجود
 * هستند: سفارش‌ها (`Order`)، کدهای تخفیف استفاده‌شده
 * (`CouponRedemption`)، کیف پول (`Wallet`)، و صف درخواست‌های
 * برداشت وجه (`WithdrawalRequest`). هیچ Badge با عدد ساختگی نمایش
 * داده نمی‌شود — طبق همان اصل رعایت‌شده در Bottom Bar (شمارنده سبد
 * خرید صفر واقعی).
 *
 * لینک مقصد سه ردیف (`/orders`، `/account/coupons`، `/wallet`) هنوز
 * صفحه ندارند — دقیقاً هم‌الگو با `/search`/`/notifications`/
 * `/support` در Top Bar: لینک از قبل درست ساخته می‌شود، خود صفحه
 * مقصد در ماژول بعدی اضافه خواهد شد.
 */
export default async function AccountPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?redirect=/account");
  }

  await connectToDatabase();

  const [ordersCount, wallet, usedCouponsCount, pendingWithdrawalsCount] =
    await Promise.all([
      Order.countDocuments({ customer: user._id }),
      Wallet.findOne({ user: user._id }).lean(),
      CouponRedemption.countDocuments({ user: user._id }),
      WithdrawalRequest.countDocuments({ user: user._id, status: "pending" }),
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
        <section className="rounded-[var(--radius-lg)] border border-black/5 bg-white p-4">
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
          </div>
        </section>

        {/* مالی */}
        <section>
          <h2 className="mb-2 px-1 text-xs font-bold text-[var(--sf-ink)]/50">
            مالی
          </h2>
          <div className="divide-y divide-black/5 overflow-hidden rounded-[var(--radius-lg)] border border-black/5 bg-white">
            <AccountNavRow
              href="/wallet"
              icon={WalletIcon}
              iconClassName="bg-emerald-50 text-emerald-600"
              title="کیف پول من"
              subtitle={`موجودی: ${formatTomanGlyph(walletBalance)}`}
            />
            <AccountNavRow
              href="/wallet/withdrawals"
              icon={RefreshCcw}
              iconClassName="bg-rose-50 text-rose-600"
              title="تراکنش‌ها و بازگشت وجه"
              subtitle="پیگیری مبالغ عودت‌شده"
              badge={pendingWithdrawalsCount || undefined}
              badgeVariant="attention"
            />
          </div>
        </section>

        <AccountLogoutButton />
      </div>
    </div>
  );
}
