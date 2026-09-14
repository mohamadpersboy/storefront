import { redirect } from "next/navigation";
import Link from "next/link";
import { PlusCircle, ArrowLeftRight, Landmark } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/current-user";
import { connectToDatabase } from "@/lib/db/connect";
import { getOrCreateWallet } from "@/lib/wallet/wallet-service";
import { WalletTransaction } from "@/models/WalletTransaction";
import { WithdrawalRequest } from "@/models/WithdrawalRequest";
import { formatTomanGlyph } from "@/lib/utils/format";
import { PageHeader } from "@/components/storefront/page-header";
import { WalletTransactionRow } from "@/components/storefront/wallet-transaction-row";

const TRANSACTIONS_PAGE_SIZE = 30;

/**
 * صفحه «کیف پول من» Storefront — شامل موجودی، دو اقدام (شارژ/درخواست
 * تسویه)، و تاریخچه کامل تراکنش‌ها با ۴ دسته‌ای که کارفرما تعریف
 * کرد (نگاه کنید `lib/utils/wallet-transactions.ts` برای این‌که چرا
 * «پرداخت با کیف پول» و «پرداخت ترکیبی» در دفتر کیف پول یک دسته‌اند).
 *
 * «پرداخت با کیف پول»/«پرداخت ترکیبی» از این صفحه شروع نمی‌شوند —
 * این دو، رفتار لحظه Checkout سفارش هستند (کاربر یا ادمین هنگام
 * پرداخت یک سفارش تصمیم می‌گیرد کیف پول استفاده شود یا نه)، نه یک
 * صفحه مستقل کیف پول. Backend آن‌ها کاملاً آماده است
 * (`Payment.walletAmount`, `initiateOrderPayment({ useWallet })`)
 * اما چون Storefront هنوز صفحه Cart/Checkout ندارد، امروز هیچ
 * تراکنشی از این دو نوع تولید نمی‌شود؛ همین‌که Checkout ساخته شود،
 * بدون هیچ تغییری در این صفحه، در همین تاریخچه به‌درستی («پرداخت
 * سفارش») نمایش داده خواهند شد.
 */
export default async function WalletPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?redirect=/account/wallet");
  }

  await connectToDatabase();

  const [wallet, transactions, pendingWithdrawalsCount] = await Promise.all([
    getOrCreateWallet(String(user._id)),
    WalletTransaction.find({ user: user._id })
      .sort({ createdAt: -1 })
      .limit(TRANSACTIONS_PAGE_SIZE)
      .lean(),
    WithdrawalRequest.countDocuments({ user: user._id, status: "pending" }),
  ]);

  return (
    <div>
      <PageHeader title="کیف پول من" />

      <div className="space-y-5 px-4 py-4 sm:px-6">
        <div className="relative overflow-hidden rounded-[var(--radius-lg)] bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 p-5 text-white shadow-lg">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-8 -top-10 size-36 rounded-full bg-white/10"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-12 -right-4 size-36 rounded-full bg-white/10"
          />

          <div className="relative flex items-center gap-1.5 text-xs text-white/70">
            <Landmark className="size-3.5" strokeWidth={1.75} aria-hidden="true" />
            موجودی کیف پول
          </div>
          <p className="relative mt-2 text-3xl font-extrabold tracking-tight">
            {formatTomanGlyph(wallet.balance)}
          </p>

          {pendingWithdrawalsCount > 0 && (
            <p className="relative mt-2 inline-block rounded-full bg-white/15 px-2.5 py-0.5 text-[11px] font-medium text-white/90">
              {pendingWithdrawalsCount.toLocaleString("fa-IR")} درخواست تسویه در انتظار بررسی
            </p>
          )}

          <div className="relative mt-5 grid grid-cols-2 gap-2.5">
            <Link
              href="/account/wallet/topup"
              className="flex items-center justify-center gap-1.5 rounded-[var(--radius-md)] bg-white py-2.5 text-xs font-bold text-emerald-700 active:bg-white/90"
            >
              <PlusCircle className="size-4" strokeWidth={2} aria-hidden="true" />
              شارژ کیف پول
            </Link>
            <Link
              href="/account/wallet/withdraw"
              className="flex items-center justify-center gap-1.5 rounded-[var(--radius-md)] bg-white/15 py-2.5 text-xs font-bold text-white backdrop-blur active:bg-white/25"
            >
              <ArrowLeftRight className="size-4" strokeWidth={1.75} aria-hidden="true" />
              درخواست تسویه
            </Link>
          </div>
        </div>

        <section>
          <h2 className="mb-2 px-1 text-xs font-bold text-[var(--sf-ink)]/50">تراکنش‌ها</h2>

          {transactions.length === 0 ? (
            <p className="rounded-[var(--radius-lg)] border border-dashed border-black/10 bg-white px-4 py-8 text-center text-sm text-[var(--sf-ink)]/50">
              هنوز تراکنشی در کیف پول شما ثبت نشده است.
            </p>
          ) : (
            <div className="divide-y divide-black/5 overflow-hidden rounded-[var(--radius-lg)] border border-black/5 bg-white">
              {transactions.map((t) => (
                <WalletTransactionRow
                  key={String(t._id)}
                  transaction={{
                    id: String(t._id),
                    type: t.type,
                    amount: t.amount,
                    reason: t.reason,
                    createdAt: t.createdAt.toISOString(),
                  }}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
