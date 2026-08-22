import { Suspense } from "react";
import { OtpLoginForm } from "@/components/auth/otp-login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-[var(--radius-lg)] border border-border bg-surface p-6">
        <div className="mb-6 text-center">
          <span className="mx-auto mb-3 flex size-10 items-center justify-center rounded-[var(--radius-md)] bg-primary text-sm font-bold text-primary-foreground">
            س
          </span>
          <h1 className="text-lg font-semibold text-foreground">
            ورود به فرش سقطچی
          </h1>
          <p className="mt-1 text-xs text-muted">
            با شماره موبایل خود وارد شوید
          </p>
        </div>
        <Suspense>
          <OtpLoginForm />
        </Suspense>
      </div>
    </main>
  );
}
