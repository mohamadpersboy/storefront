"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ReviewStars } from "@/components/reviews/review-stars";
import {
  REVIEW_RECOMMENDATION_LABELS,
  REVIEW_STATUS_LABELS,
  REVIEW_TEXT_MAX,
} from "@/lib/reviews/constants";
import type { AdminReviewDetailDTO } from "@/lib/reviews/serialize";
import { STATUS_TONE } from "@/components/reviews/review-tones";
import { toPersianDigits } from "@/lib/utils/format";

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("fa-IR", { dateStyle: "medium", timeStyle: "short" });
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
      <dt className="w-32 shrink-0 text-xs text-muted">{label}</dt>
      <dd className="text-sm text-foreground">{children}</dd>
    </div>
  );
}

export function ReviewDetailModal({ id, onClose }: { id: string; onClose: () => void }) {
  const [detail, setDetail] = useState<AdminReviewDetailDTO | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/v1/reviews/admin/${id}`)
      .then((res) => res.json())
      .then((body) => {
        if (cancelled) return;
        if (!body.success) throw new Error();
        setDetail(body.data);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="جزئیات نظر"
        className="relative flex max-h-[90vh] w-full max-w-lg flex-col gap-4 overflow-y-auto rounded-[var(--radius-lg)] border border-border bg-surface p-5"
      >
        <h2 className="text-sm font-semibold text-foreground">جزئیات نظر</h2>

        {error ? (
          <p className="text-sm text-danger">دریافت جزئیات نظر ناموفق بود.</p>
        ) : !detail ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : (
          <dl className="flex flex-col gap-3">
            <Row label="محصول">{detail.product?.title ?? "—"}</Row>
            <Row label="کاربر">
              {detail.user ? `${detail.user.name} (${toPersianDigits(detail.user.phoneNumber)})` : "—"}
            </Row>
            <Row label="امتیاز">
              <ReviewStars rating={detail.rating} />
            </Row>
            <Row label="توصیه">{REVIEW_RECOMMENDATION_LABELS[detail.recommendation]}</Row>
            <Row label="خریدار">
              {detail.isVerifiedBuyer ? (
                <span>
                  خریدار
                  {detail.orderNumber !== null ? ` — سفارش ${toPersianDigits(detail.orderNumber)}` : ""}
                </span>
              ) : (
                "خیر"
              )}
            </Row>
            <Row label="وضعیت">
              <Badge tone={STATUS_TONE[detail.status]}>{REVIEW_STATUS_LABELS[detail.status]}</Badge>
            </Row>
            <Row label={`متن (حداکثر ${toPersianDigits(REVIEW_TEXT_MAX)} نویسه)`}>
              {/* Plain Text — بدون HTML؛ React خودش Escape می‌کند. */}
              <p className="whitespace-pre-wrap break-words">{detail.text}</p>
            </Row>
            <Row label="تاریخ ثبت">{formatDateTime(detail.createdAt)}</Row>
            {detail.moderatedAt ? (
              <Row label="تاریخ بررسی">
                {formatDateTime(detail.moderatedAt)}
                {detail.moderator ? ` توسط ${detail.moderator}` : ""}
              </Row>
            ) : null}
            {detail.rejectionReason ? <Row label="دلیل رد">{detail.rejectionReason}</Row> : null}
            {detail.images.length > 0 ? (
              <Row label="تصاویر">
                <div className="flex gap-2">
                  {detail.images.map((img) => (
                    <a key={img.url} href={img.url} target="_blank" rel="noopener noreferrer">
                      <Image
                        src={img.url}
                        alt="تصویر نظر"
                        width={90}
                        height={120}
                        className="h-[120px] w-[90px] rounded-[var(--radius-sm)] object-cover"
                      />
                    </a>
                  ))}
                </div>
              </Row>
            ) : null}
          </dl>
        )}

        <div className="flex justify-end">
          <Button variant="secondary" size="sm" onClick={onClose}>
            بستن
          </Button>
        </div>
      </div>
    </div>
  );
}
