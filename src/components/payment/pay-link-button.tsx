"use client";

import { useState } from "react";
import { Loader2, Lock } from "lucide-react";

/**
 * شروع پرداخت از صفحه‌ی `/pay/<token>`. فقط توکن به سرور می‌رود؛ مبلغ و سفارش
 * از DB خوانده می‌شود. کاربر هیچ‌وقت لینک خام درگاه را نمی‌بیند.
 */
export function PayLinkButton({ token, label }: { token: string; label: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/pay/${encodeURIComponent(token)}/start`, { method: "POST" });
      const body = (await res.json().catch(() => null)) as {
        success?: boolean;
        message?: string;
        data?: { paymentUrl?: string };
      } | null;
      if (!res.ok || !body?.success || !body.data?.paymentUrl) {
        setError(body?.message ?? "شروع پرداخت ممکن نشد؛ دوباره تلاش کنید");
        setPending(false);
        return;
      }
      // تا بازگشت از درگاه، دکمه فعال نمی‌شود (جلوگیری از دوبار کلیک).
      window.location.href = body.data.paymentUrl;
    } catch {
      setError("ارتباط با سرور برقرار نشد؛ دوباره تلاش کنید");
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={start}
        disabled={pending}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-[var(--radius-md)] bg-primary text-sm font-semibold text-white transition active:scale-[0.99] disabled:opacity-70"
      >
        {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Lock className="size-4" aria-hidden="true" />}
        {pending ? "در حال انتقال به درگاه..." : label}
      </button>
      {error ? (
        <p role="alert" className="text-center text-sm text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
