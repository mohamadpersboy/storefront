"use client";

import { useEffect, useState, useTransition } from "react";
import { History } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";

const PAGE_SIZE = 20;

interface ApiLog {
  id: string;
  actorName: string;
  description: string;
  createdAt: string;
}

function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("fa-IR", { dateStyle: "short", timeStyle: "short" }).format(
    new Date(iso),
  );
}

export function ActivityLogPageClient() {
  const [page, setPage] = useState(1);
  const [logs, setLogs] = useState<ApiLog[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);
  const [loading, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;
    startTransition(async () => {
      try {
        const res = await fetch(`/api/v1/activity-log?page=${page}&limit=${PAGE_SIZE}`);
        const body = await res.json();
        if (!res.ok || !body.success) throw new Error(body.message);
        if (cancelled) return;
        setLogs(body.data);
        setTotalPages(body.pagination?.totalPages ?? 1);
        setError(false);
      } catch {
        if (!cancelled) setError(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [page, reloadToken]);

  return (
    <Card className="overflow-hidden">
      {loading && logs.length === 0 ? (
        <div className="flex flex-col gap-2 p-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : error ? (
        <ErrorState onRetry={() => setReloadToken((t) => t + 1)} />
      ) : logs.length === 0 ? (
        <EmptyState
          icon={History}
          title="هنوز فعالیتی ثبت نشده"
          description="تغییرات حساس (نقش کاربر، وضعیت سفارش، کدهای تخفیف و ...) اینجا نمایش داده می‌شوند."
        />
      ) : (
        <>
          <ul className="divide-y divide-border">
            {logs.map((log) => (
              <li key={log.id} className="flex flex-col gap-1 px-4 py-3 text-sm">
                <span className="text-foreground">{log.description}</span>
                <span className="text-xs text-muted">
                  {log.actorName} · {formatDateTime(log.createdAt)}
                </span>
              </li>
            ))}
          </ul>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </Card>
  );
}
