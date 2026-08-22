"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toPersianDigits } from "@/lib/utils/format";

type Step = "phone" | "otp";

const RESEND_COOLDOWN_SECONDS = 60;

export function OtpLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") ?? "/dashboard";

  const [step, setStep] = useState<Step>("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const otpInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  useEffect(() => {
    if (step === "otp") otpInputRef.current?.focus();
  }, [step]);

  async function requestOtp(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);

    if (!/^09\d{9}$/.test(phoneNumber)) {
      setError("شماره موبایل معتبر نیست");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/v1/auth/otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber }),
      });
      const body = await res.json();

      if (!res.ok || !body.success) {
        setError(body.message ?? "خطایی رخ داد");
        return;
      }

      setStep("otp");
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch {
      setError("ارتباط با سرور برقرار نشد");
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!/^\d{4}$/.test(code)) {
      setError("کد تأیید باید ۴ رقم باشد");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/v1/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber, code }),
      });
      const body = await res.json();

      if (!res.ok || !body.success) {
        setError(body.message ?? "کد تأیید نادرست است");
        return;
      }

      router.push(redirectTo);
      router.refresh();
    } catch {
      setError("ارتباط با سرور برقرار نشد");
    } finally {
      setLoading(false);
    }
  }

  if (step === "phone") {
    return (
      <form onSubmit={requestOtp} className="flex flex-col gap-4">
        <div>
          <label
            htmlFor="phoneNumber"
            className="mb-1.5 block text-xs font-medium text-foreground/80"
          >
            شماره موبایل
          </label>
          <Input
            id="phoneNumber"
            inputMode="numeric"
            dir="ltr"
            placeholder="09xxxxxxxxx"
            value={phoneNumber}
            maxLength={11}
            onChange={(e) =>
              setPhoneNumber(e.target.value.replace(/[^\d]/g, ""))
            }
          />
        </div>
        {error ? <p className="text-xs text-danger">{error}</p> : null}
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "در حال ارسال..." : "دریافت کد تأیید"}
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={verifyOtp} className="flex flex-col gap-4">
      <div>
        <p className="mb-1.5 text-xs text-muted">
          کد ارسال‌شده به {toPersianDigits(phoneNumber)} را وارد کنید
        </p>
        <Input
          ref={otpInputRef}
          inputMode="numeric"
          dir="ltr"
          placeholder="----"
          value={code}
          maxLength={4}
          onChange={(e) => setCode(e.target.value.replace(/[^\d]/g, ""))}
          className="text-center text-lg tracking-[0.5em]"
        />
      </div>
      {error ? <p className="text-xs text-danger">{error}</p> : null}
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "در حال بررسی..." : "ورود"}
      </Button>
      <button
        type="button"
        disabled={cooldown > 0}
        onClick={() => requestOtp()}
        className="text-xs text-primary disabled:cursor-not-allowed disabled:text-muted-foreground"
      >
        {cooldown > 0
          ? `ارسال مجدد کد تا ${toPersianDigits(cooldown)} ثانیه دیگر`
          : "ارسال مجدد کد"}
      </button>
      <button
        type="button"
        onClick={() => {
          setStep("phone");
          setCode("");
          setError(null);
        }}
        className="text-xs text-muted hover:text-foreground"
      >
        ویرایش شماره موبایل
      </button>
    </form>
  );
}
