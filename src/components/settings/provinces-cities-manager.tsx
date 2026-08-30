"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface Province {
  id: string;
  name: string;
  code: string;
}

interface RejectedRow {
  row: number;
  message: string;
}

interface ImportResult {
  provincesUpserted: number;
  citiesUpserted: number;
  transactional: boolean;
  rejectedRows: RejectedRow[];
}

export function ProvincesCitiesManager() {
  const [provinces, setProvinces] = useState<Province[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function loadProvinces() {
    fetch("/api/v1/provinces")
      .then((res) => res.json())
      .then((body) => {
        if (body.success) setProvinces(body.data);
        else setLoadError(body.message ?? "خطا در دریافت فهرست استان‌ها");
      })
      .catch(() => setLoadError("ارتباط با سرور برقرار نشد"));
  }

  useEffect(loadProvinces, []);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/v1/provinces/import", {
        method: "POST",
        body: formData,
      });
      const body = await res.json();
      if (!res.ok || !body.success) {
        setUploadError(body.message ?? "خطا در Import فایل");
        if (body.errors?.rows) {
          setResult({
            provincesUpserted: 0,
            citiesUpserted: 0,
            transactional: false,
            rejectedRows: body.errors.rows.map((m: string, i: number) => ({ row: i, message: m })),
          });
        }
        return;
      }
      setResult(body.data);
      loadProvinces();
    } catch {
      setUploadError("ارتباط با سرور برقرار نشد");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader
          title="Import از فایل Excel"
          description='ستون‌های لازم: "Province", "Province Code", "City", "City Code"'
        />
        <CardContent className="flex flex-col gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            disabled={uploading}
            className="text-sm text-foreground file:me-3 file:rounded-[var(--radius-md)] file:border-0 file:bg-primary-soft file:px-3 file:py-2 file:text-sm file:text-primary"
          />
          {uploading ? <p className="text-sm text-muted">در حال Import...</p> : null}
          {uploadError ? <p className="text-sm text-danger">{uploadError}</p> : null}
          {result ? (
            <div className="flex flex-col gap-2 rounded-[var(--radius-md)] bg-surface-subtle p-3 text-sm">
              <p className="text-foreground">
                {result.provincesUpserted} استان و {result.citiesUpserted} شهر ثبت/به‌روزرسانی شد
                {result.transactional ? "" : " (به‌صورت غیر-Transactional)"}
              </p>
              {result.rejectedRows.length > 0 ? (
                <div className="flex flex-col gap-1">
                  <p className="text-xs font-medium text-danger">
                    {result.rejectedRows.length} سطر رد شد:
                  </p>
                  <ul className="flex flex-col gap-0.5 text-xs text-muted">
                    {result.rejectedRows.slice(0, 20).map((r, i) => (
                      <li key={i}>
                        {r.message}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="استان‌های ثبت‌شده" description={provinces ? `${provinces.length} استان` : undefined} />
        <CardContent>
          {loadError ? <p className="text-sm text-danger">{loadError}</p> : null}
          {!provinces && !loadError ? (
            <div className="flex flex-col gap-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : null}
          {provinces && provinces.length === 0 ? (
            <p className="text-sm text-muted">هنوز هیچ استانی Import نشده است.</p>
          ) : null}
          {provinces && provinces.length > 0 ? (
            <ul className="divide-y divide-border">
              {provinces.map((p) => (
                <li key={p.id} className="flex items-center justify-between py-2 text-sm">
                  <span className="text-foreground">{p.name}</span>
                  <span dir="ltr" className="text-xs text-muted">{p.code}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="button" variant="secondary" onClick={loadProvinces}>
          بروزرسانی فهرست
        </Button>
      </div>
    </div>
  );
}
