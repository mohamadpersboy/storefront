import {
  ArrowDownToLine,
  ArrowUpFromLine,
  ShoppingBag,
  Settings2,
  type LucideIcon,
} from "lucide-react";
import { classifyWalletTransaction, type WalletTransactionCategory } from "@/lib/utils/wallet-transactions";
import { formatTomanGlyph } from "@/lib/utils/format";
import { formatJalali } from "@/lib/utils/jalali";

const CATEGORY_CONFIG: Record<
  WalletTransactionCategory,
  { label: string; icon: LucideIcon; badgeClassName: string }
> = {
  topup: { label: "شارژ کیف پول", icon: ArrowDownToLine, badgeClassName: "bg-emerald-50 text-emerald-600" },
  withdrawal: { label: "درخواست تسویه", icon: ArrowUpFromLine, badgeClassName: "bg-rose-50 text-rose-600" },
  order_payment: { label: "پرداخت سفارش", icon: ShoppingBag, badgeClassName: "bg-blue-50 text-blue-600" },
  manual_adjustment: {
    label: "تعدیل توسط پشتیبانی",
    icon: Settings2,
    badgeClassName: "bg-violet-50 text-violet-600",
  },
};

export type WalletTransactionRowData = {
  id: string;
  type: "credit" | "debit";
  amount: number;
  reason: string;
  createdAt: string;
};

/**
 * یک ردیف از تاریخچه تراکنش‌های کیف پول. دسته (شارژ/تسویه/پرداخت
 * سفارش/تعدیل پشتیبانی) از روی متن `reason` با `classifyWalletTransaction`
 * تشخیص داده می‌شود (توضیح کامل چرایی در همان فایل).
 */
export function WalletTransactionRow({ transaction }: { transaction: WalletTransactionRowData }) {
  const category = classifyWalletTransaction(transaction.reason);
  const { label, icon: Icon, badgeClassName } = CATEGORY_CONFIG[category];
  const isCredit = transaction.type === "credit";

  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <span
        className={`flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] ${badgeClassName}`}
      >
        <Icon className="size-5" strokeWidth={1.75} aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-[var(--sf-ink)]">{label}</p>
        <p className="mt-0.5 truncate text-xs text-[var(--sf-ink)]/50">{transaction.reason}</p>
      </div>
      <div className="shrink-0 text-left">
        <p className={`text-sm font-bold ${isCredit ? "text-emerald-600" : "text-rose-600"}`}>
          {isCredit ? "+" : "−"}
          {formatTomanGlyph(transaction.amount)}
        </p>
        <p className="mt-0.5 text-[10px] text-[var(--sf-ink)]/40">
          {formatJalali(transaction.createdAt)}
        </p>
      </div>
    </div>
  );
}
