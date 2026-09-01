import Link from "next/link";
import { CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { formatToman } from "@/lib/utils/format";

export const metadata = { title: "نتیجه شارژ کیف پول" };

export default async function WalletTopupResultPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; amount?: string }>;
}) {
  const { status, amount } = await searchParams;

  const config = {
    success: {
      icon: CheckCircle2,
      color: "text-green-600",
      title: "شارژ کیف پول با موفقیت انجام شد",
      description: "موجودی کیف پول شما به‌روزرسانی شد.",
    },
    failed: {
      icon: XCircle,
      color: "text-danger",
      title: "شارژ کیف پول ناموفق بود",
      description: "پرداخت تکمیل نشد یا توسط شما لغو شد. می‌توانید دوباره تلاش کنید.",
    },
    error: {
      icon: AlertTriangle,
      color: "text-amber-600",
      title: "خطا در پردازش شارژ",
      description: "این لینک پرداخت معتبر نیست یا منقضی شده است.",
    },
  } as const;

  const view = config[status as keyof typeof config] ?? config.error;
  const Icon = view.icon;

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface-subtle px-4">
      <div className="w-full max-w-sm rounded-[var(--radius-lg)] border border-border bg-white p-6 text-center shadow-sm">
        <Icon className={`mx-auto size-12 ${view.color}`} />
        <h1 className="mt-4 text-base font-semibold text-foreground">{view.title}</h1>
        <p className="mt-2 text-sm text-muted">{view.description}</p>

        {amount ? (
          <div className="mt-4 rounded-[var(--radius-md)] border border-dashed border-border-strong p-3 text-sm">
            <span className="font-medium text-foreground">{formatToman(Number(amount))}</span>
          </div>
        ) : null}

        <Link href="/" className="mt-5 inline-block text-sm text-primary hover:underline">
          بازگشت به فروشگاه
        </Link>
      </div>
    </main>
  );
}
