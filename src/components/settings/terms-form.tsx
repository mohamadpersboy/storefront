"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface TermsData {
  title: string;
  content: string;
}

/**
 * فرم مدیریت «قوانین و مقررات» — عیناً هم‌الگو با `AboutUsForm`
 * (همان مدل تک‌سندی `GET`/`PATCH /api/v1/terms`)، فقط بدون فیلد
 * تصویر که برای این صفحه معنا ندارد.
 */
export function TermsForm() {
  const [data, setData] = useState<TermsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/v1/terms")
      .then((res) => res.json())
      .then((body) => {
        if (body.success) setData(body.data);
        else setError(body.message ?? "خطا در دریافت اطلاعات");
      })
      .catch(() => setError("ارتباط با سرور برقرار نشد"));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!data) return;
    setSaving(true);
    setError(null);
    setFieldErrors({});
    try {
      const res = await fetch("/api/v1/terms", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const body = await res.json();
      if (!res.ok || !body.success) {
        setError(body.message ?? "خطا در ذخیره اطلاعات");
        if (body.errors) setFieldErrors(body.errors);
        return;
      }
      setSavedAt(Date.now());
    } catch {
      setError("ارتباط با سرور برقرار نشد");
    } finally {
      setSaving(false);
    }
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="flex flex-col gap-3 p-5">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Card>
        <CardHeader
          title="قوانین و مقررات"
          description="این محتوا در صفحه «قوانین و مقررات»ی فروشگاه (Storefront) نمایش داده می‌شود"
        />
        <CardContent className="flex flex-col gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-foreground/80">
              عنوان
            </label>
            <Input
              value={data.title}
              onChange={(e) => setData({ ...data, title: e.target.value })}
              placeholder="مثلاً قوانین و مقررات"
            />
            {fieldErrors.title ? (
              <p className="mt-1 text-xs text-danger">{fieldErrors.title[0]}</p>
            ) : null}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-foreground/80">
              متن
            </label>
            <Textarea
              rows={12}
              value={data.content}
              onChange={(e) => setData({ ...data, content: e.target.value })}
              placeholder="متن کامل قوانین و مقررات، شرایط ارسال، بازگشت کالا و..."
            />
            {fieldErrors.content ? (
              <p className="mt-1 text-xs text-danger">{fieldErrors.content[0]}</p>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {savedAt ? <p className="text-sm text-green-700">اطلاعات ذخیره شد.</p> : null}

      <div className="flex justify-end">
        <Button type="submit" disabled={saving}>
          {saving ? "در حال ذخیره..." : "ذخیره تنظیمات"}
        </Button>
      </div>
    </form>
  );
}
