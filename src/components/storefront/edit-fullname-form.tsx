"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function EditFullNameForm({ initialFullName }: { initialFullName: string }) {
  const router = useRouter();
  const [fullName, setFullName] = useState(initialFullName);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/v1/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName }),
      });
      const body = await res.json();

      if (!res.ok || !body.success) {
        setError(body.message ?? "ذخیره نام ممکن نشد");
        return;
      }

      setSuccess(body.message ?? "نام با موفقیت ذخیره شد");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-[var(--radius-lg)] border border-black/5 bg-white p-4">
      <p className="flex items-center gap-1.5 text-sm font-bold text-[var(--sf-ink)]">
        <User className="size-4 text-[var(--color-primary)]" strokeWidth={1.75} aria-hidden="true" />
        نام و نام‌خانوادگی
      </p>
      <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
      {error && <p className="text-xs text-danger">{error}</p>}
      {success && <p className="text-xs text-emerald-600">{success}</p>}
      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? "در حال ذخیره…" : "ذخیره نام"}
      </Button>
    </form>
  );
}
