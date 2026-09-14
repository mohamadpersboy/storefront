"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Phone, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Step = "idle" | "input" | "otp";

const RESEND_COOLDOWN_SECONDS = 60;

/**
 * تغییر شماره موبایل — سه مرحله: نمایش شماره فعلی → ورود شماره
 * جدید → تایید کد پیامکی. هر دو مرحله آخر مستقیماً به
 * `account/phone/request-otp` و `account/phone/verify-otp` وصل
 * می‌شوند (همان زیرساخت OTP ورود، طبق درخواست صریح کارفرما).
 */
export function ChangePhoneForm({ currentPhoneNumber }: { currentPhoneNumber: string }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("idle");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [code, setCode] = useState("");
  const [displayedPhone, setDisplayedPhone] = useState(currentPhoneNumber);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  function reset() {
    setStep("idle");
    setPhoneNumber("");
    setCode("");
    setError(null);
  }

  async function requestOtp() {
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/v1/account/phone/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber }),
      });
      const body = await res.json();

      if (!res.ok || !body.success) {
        setError(body.message ?? "ارسال کد ممکن نشد");
        return;
      }

      setStep("otp");
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRequestOtp(e: React.FormEvent) {
    e.preventDefault();
    await requestOtp();
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/v1/account/phone/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber, code }),
      });
      const body = await res.json();

      if (!res.ok || !body.success) {
        setError(body.message ?? "تایید کد ممکن نشد");
        return;
      }

      setDisplayedPhone(body.data.phoneNumber);
      setSuccess("شماره موبایل با موفقیت تغییر کرد");
      setStep("idle");
      setPhoneNumber("");
      setCode("");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-3 rounded-[var(--radius-lg)] border border-black/5 bg-white p-4">
      <p className="flex items-center gap-1.5 text-sm font-bold text-[var(--sf-ink)]">
        <Phone className="size-4 text-[var(--color-primary)]" strokeWidth={1.75} aria-hidden="true" />
        شماره موبایل
      </p>

      {step === "idle" && (
        <>
          <p dir="ltr" className="text-left text-sm text-[var(--sf-ink)]/70">
            {displayedPhone}
          </p>
          {success && <p className="text-xs text-emerald-600">{success}</p>}
          <Button
            type="button"
            variant="secondary"
            className="w-full"
            onClick={() => {
              setSuccess(null);
              setStep("input");
            }}
          >
            تغییر شماره موبایل
          </Button>
        </>
      )}

      {step === "input" && (
        <form onSubmit={handleRequestOtp} className="space-y-3">
          <label className="block text-xs font-medium text-[var(--sf-ink)]/70">
            شماره موبایل جدید
          </label>
          <Input
            dir="ltr"
            inputMode="numeric"
            maxLength={11}
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value.replace(/[^\d]/g, ""))}
            placeholder="09xxxxxxxxx"
          />
          {error && <p className="text-xs text-danger">{error}</p>}
          <div className="flex gap-2">
            <Button type="submit" disabled={submitting} className="flex-1">
              {submitting ? "در حال ارسال…" : "ارسال کد تایید"}
            </Button>
            <Button type="button" variant="secondary" onClick={reset} disabled={submitting}>
              انصراف
            </Button>
          </div>
        </form>
      )}

      {step === "otp" && (
        <form onSubmit={handleVerifyOtp} className="space-y-3">
          <p className="flex items-start gap-1.5 text-xs text-[var(--sf-ink)]/50">
            <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-emerald-600" strokeWidth={1.75} aria-hidden="true" />
            کد تایید به شماره <span dir="ltr">{phoneNumber}</span> پیامک شد.
          </p>
          <Input
            dir="ltr"
            inputMode="numeric"
            maxLength={4}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/[^\d]/g, ""))}
            placeholder="----"
          />
          {error && <p className="text-xs text-danger">{error}</p>}
          <div className="flex gap-2">
            <Button type="submit" disabled={submitting} className="flex-1">
              {submitting ? "در حال تایید…" : "تایید و ذخیره"}
            </Button>
            <Button type="button" variant="secondary" onClick={reset} disabled={submitting}>
              انصراف
            </Button>
          </div>
          <button
            type="button"
            disabled={cooldown > 0 || submitting}
            onClick={() => requestOtp()}
            className="w-full text-center text-xs font-medium text-[var(--color-primary)] disabled:text-[var(--sf-ink)]/30"
          >
            {cooldown > 0 ? `ارسال مجدد کد (${cooldown.toLocaleString("fa-IR")} ثانیه)` : "ارسال مجدد کد"}
          </button>
        </form>
      )}
    </div>
  );
}
