"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MyReviewCard } from "@/components/storefront/my-review-card";
import { ProductReviewForm } from "@/components/storefront/product-review-form";
import { Button } from "@/components/ui/button";
import type { MyReviewDTO, MyReviewState } from "@/lib/reviews/my-review";
import type { ReviewPayload } from "@/lib/storefront/review-form";
import {
  mapReviewDeleteError,
  REVIEW_BUYERS_ONLY_MESSAGE,
  REVIEW_DELETE_CONFIRM_MESSAGE,
  REVIEW_GUEST_MESSAGE,
  REVIEW_SUBMIT_SUCCESS_MESSAGE,
  REVIEW_UNAVAILABLE_MESSAGE,
} from "@/lib/storefront/review-form-messages";

/**
 * ناحیه ثبت/نمایش/حذف نظر کاربر؛ اولین مورد داخل پاپ‌آپ نظرات.
 * `state` از سرور می‌آید؛ `null` یعنی وضعیت در دسترس نیست. با بسته شدن
 * پاپ‌آپ این کامپوننت Unmount می‌شود و اگر ثبت/حذفی شده بود،
 * `router.refresh()` آمار و وضعیت سرور را تازه می‌کند. تأیید حذف داخل
 * همین کارت است (بدون Sheet تو در تو، تا Escape فقط یک لایه را ببندد).
 */
export function ProductReviewActions({
  productId,
  slug,
  isAuthenticated,
  state,
}: {
  productId: string;
  slug: string;
  isAuthenticated: boolean;
  state: MyReviewState | null;
}) {
  const router = useRouter();
  const [review, setReview] = useState<MyReviewDTO | null>(
    state?.review ?? null,
  );
  const [justSubmitted, setJustSubmitted] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const dirtyRef = useRef(false);

  useEffect(() => {
    return () => {
      if (dirtyRef.current) router.refresh();
    };
  }, [router]);

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col gap-2 rounded-2xl bg-gray-100 p-3">
        <p className="text-sm text-gray-600">{REVIEW_GUEST_MESSAGE}</p>
        <Link
          href={`/login?redirect=${encodeURIComponent(`/products/${slug}`)}`}
          className="inline-flex h-10 w-max items-center rounded-xl bg-[var(--sf-accent)] px-4 text-sm font-medium text-white"
        >
          ورود به حساب کاربری
        </Link>
      </div>
    );
  }

  if (!state) return null;

  function handleSubmitted(id: string, payload: ReviewPayload) {
    setReview({
      id,
      status: "pending",
      rating: payload.rating,
      recommendation: payload.recommendation,
      text: payload.text,
      images: payload.images.map((img) => ({
        url: img.url,
        width: 0,
        height: 0,
      })),
      createdAt: new Date().toISOString(),
    });
    setJustSubmitted(true);
    setFormOpen(false);
    dirtyRef.current = true;
  }

  async function handleDelete() {
    if (!review || deleting) return;
    setDeleting(true);
    setDeleteError(null);
    let status = 0;
    try {
      const res = await fetch(`/api/v1/reviews/${review.id}`, {
        method: "DELETE",
      });
      status = res.status;
    } catch {
      status = 0;
    }
    setDeleting(false);

    if (status >= 200 && status < 300) {
      setConfirmOpen(false);
      setReview(null);
      setJustSubmitted(false);
      dirtyRef.current = true;
      return;
    }
    const mapped = mapReviewDeleteError(status);
    setDeleteError(mapped.message);
    if (mapped.refresh) router.refresh();
  }

  const showForm = review === null && state.canReview;

  return (
    <div className="flex flex-col gap-3">
      {review ? (
        <div className="rounded-2xl bg-gray-100 p-3">
          <p className="mb-2 text-sm font-semibold text-[var(--sf-ink)]">
            نظر شما
          </p>
          {justSubmitted ? (
            <p
              role="status"
              className="mb-2 rounded-xl bg-green-50 px-3 py-2 text-xs text-green-700"
            >
              {REVIEW_SUBMIT_SUCCESS_MESSAGE}
            </p>
          ) : null}
          <MyReviewCard review={review} />

          {confirmOpen ? (
            <div className="mt-3 flex flex-col gap-2 rounded-xl bg-white p-3">
              <p className="text-sm text-[var(--sf-ink)]">
                {REVIEW_DELETE_CONFIRM_MESSAGE}
              </p>
              {deleteError ? (
                <p role="alert" className="text-xs text-red-600">
                  {deleteError}
                </p>
              ) : null}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1"
                >
                  {deleting ? "در حال حذف…" : "حذف"}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setConfirmOpen(false)}
                  disabled={deleting}
                  className="flex-1"
                >
                  انصراف
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-3 flex">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  setDeleteError(null);
                  setConfirmOpen(true);
                }}
              >
                {review.status === "rejected"
                  ? "حذف و ثبت نظر جدید"
                  : "حذف نظر"}
              </Button>
            </div>
          )}
        </div>
      ) : null}

      {showForm ? (
        formOpen ? (
          <div className="rounded-2xl bg-gray-100 p-3">
            <p className="mb-3 text-sm font-semibold text-[var(--sf-ink)]">
              ثبت نظر
            </p>
            <ProductReviewForm
              productId={productId}
              canAddImages={state.canAddImages}
              onSubmitted={handleSubmitted}
            />
          </div>
        ) : (
          <Button
            type="button"
            onClick={() => setFormOpen(true)}
            className="w-full"
          >
            ثبت نظر
          </Button>
        )
      ) : null}

      {!state.canReview && !review ? (
        <p className="rounded-2xl bg-gray-100 p-3 text-sm text-gray-600">
          {state.ineligibleReason === "buyers_only"
            ? REVIEW_BUYERS_ONLY_MESSAGE
            : REVIEW_UNAVAILABLE_MESSAGE}
        </p>
      ) : null}
    </div>
  );
}
