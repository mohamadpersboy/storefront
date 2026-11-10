import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Clock, ShieldCheck, XCircle, AlertTriangle } from "lucide-react";
import { connectToDatabase } from "@/lib/db/connect";
import { getPaymentLinkView } from "@/lib/payment/payment-links";
import { PayLinkButton } from "@/components/payment/pay-link-button";
import { formatToman, toPersianDigits } from "@/lib/utils/format";

const STORE_NAME = "سرای فرش سَقَطچی";

export const dynamic = "force-dynamic";

// صفحه‌ی خصوصی است: ایندکس نشود و توکن در Referer نشت نکند.
export const metadata: Metadata = {
  title: `پرداخت سفارش | ${STORE_NAME}`,
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export default async function PayLinkPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  const { token } = await params;
  const { status } = await searchParams;

  await connectToDatabase();
  const view = await getPaymentLinkView(token);

  // `status` فقط پیام راهنما برای حالت «هنوز پرداخت‌نشده» است؛ موفقیت هرگز از آن خوانده نمی‌شود.
  const hint =
    view.state === "payable" && status === "failed"
      ? { icon: XCircle, tone: "text-danger bg-danger/5", text: "پرداخت تکمیل نشد یا لغو شد. می‌توانید دوباره تلاش کنید." }
      : view.state === "payable" && status === "pending"
        ? {
            icon: Clock,
            tone: "text-amber-700 bg-amber-50",
            text: "نتیجه‌ی پرداخت هنوز از درگاه تأیید نشده است. اگر مبلغی کسر شده، پس از تأیید ثبت می‌شود؛ از پرداخت دوباره خودداری کنید و چند دقیقه بعد همین صفحه را بازخوانی کنید.",
          }
        : null;

  return (
    <main className="flex min-h-screen flex-col items-center bg-surface-subtle px-4 py-8">
      <p className="text-sm font-semibold text-foreground/70">{STORE_NAME}</p>

      <div className="mt-6 w-full max-w-sm overflow-hidden rounded-[var(--radius-lg)] border border-border bg-white shadow-sm">
        {view.state === "unavailable" ? (
          <div className="p-6 text-center">
            <AlertTriangle className="mx-auto size-12 text-amber-600" aria-hidden="true" />
            <h1 className="mt-4 text-base font-semibold text-foreground">این لینک پرداخت معتبر نیست</h1>
            <p className="mt-2 text-sm leading-6 text-muted">
              لینک منقضی شده، ابطال شده یا سفارش دیگر قابل پرداخت نیست. برای دریافت لینک جدید با فروشگاه تماس بگیرید.
            </p>
          </div>
        ) : view.state === "paid" ? (
          <div className="p-6 text-center">
            <CheckCircle2 className="mx-auto size-12 text-green-600" aria-hidden="true" />
            <h1 className="mt-4 text-base font-semibold text-foreground">پرداخت با موفقیت انجام شد</h1>
            <p className="mt-2 text-sm leading-6 text-muted">
              پرداخت سفارش #{toPersianDigits(view.orderNumber ?? 0)} ثبت شد. وضعیت سفارش از طریق پیامک اطلاع‌رسانی می‌شود.
            </p>
            {view.amount ? (
              <p className="mt-4 rounded-[var(--radius-md)] border border-dashed border-border-strong p-3 text-sm font-medium text-foreground">
                {formatToman(view.amount)}
              </p>
            ) : null}
          </div>
        ) : view.state === "processing" ? (
          <div className="p-6 text-center">
            <Clock className="mx-auto size-12 text-amber-600" aria-hidden="true" />
            <h1 className="mt-4 text-base font-semibold text-foreground">پرداخت در حال بررسی است</h1>
            <p className="mt-2 text-sm leading-6 text-muted">
              پرداخت سفارش #{toPersianDigits(view.orderNumber ?? 0)} در حال تأیید از درگاه است. چند لحظه بعد این صفحه را بازخوانی کنید.
            </p>
          </div>
        ) : (
          <>
            <div className="border-b border-border p-5 text-center">
              <p className="text-xs text-muted">پرداخت سفارش</p>
              <p className="mt-1 text-lg font-bold text-foreground">#{toPersianDigits(view.orderNumber ?? 0)}</p>
            </div>

            <div className="flex flex-col gap-4 p-5">
              {hint ? (
                <div className={`flex items-start gap-2 rounded-[var(--radius-md)] p-3 text-xs leading-6 ${hint.tone}`}>
                  <hint.icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  <p>{hint.text}</p>
                </div>
              ) : null}

              <div className="rounded-[var(--radius-md)] bg-surface-subtle p-4 text-center">
                <p className="text-xs text-muted">مبلغ قابل پرداخت</p>
                <p className="mt-1 text-xl font-bold tabular-nums text-foreground">{formatToman(view.amount ?? 0)}</p>
              </div>

              <PayLinkButton token={token} label="پرداخت آنلاین" />

              <ul className="flex flex-col gap-2 text-xs leading-6 text-muted">
                <li className="flex items-start gap-2">
                  <ShieldCheck className="mt-0.5 size-4 shrink-0 text-green-600" aria-hidden="true" />
                  پرداخت از طریق درگاه امن بانکی انجام می‌شود و اطلاعات کارت شما نزد فروشگاه ذخیره نمی‌شود.
                </li>
                <li className="flex items-start gap-2">
                  <Clock className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  بعد از پرداخت، به همین صفحه برمی‌گردید و نتیجه را می‌بینید.
                </li>
              </ul>

              {view.expiresAt ? (
                <p className="text-center text-[11px] text-muted">اعتبار لینک تا {formatDateTime(view.expiresAt)}</p>
              ) : null}
            </div>
          </>
        )}
      </div>

      <Link href="/" className="mt-5 text-sm text-primary hover:underline">
        بازگشت به فروشگاه
      </Link>
    </main>
  );
}
