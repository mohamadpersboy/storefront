"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { Pagination } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { ReviewImageLightbox } from "@/components/storefront/review-image-lightbox";
import { ReviewListItem } from "@/components/storefront/review-list-item";
import { StorefrontSheet } from "@/components/storefront/storefront-sheet";
import type {
  PublicReviewDTO,
  PublicReviewImageDTO,
  PublicReviewStats,
} from "@/lib/reviews/public-serialize";
import { formatSheetSubtitle } from "@/lib/storefront/review-summary-format";

const PAGE_SIZE = 10;
const SKELETON_COUNT = 3;

type ListState = { items: PublicReviewDTO[]; totalPages: number };

/**
 * دکمه «خواندن نظرات» + Sheet لیست Reviewها. Stats فقط از Props
 * (Render اولیه Server) می‌آید و با تغییر صفحه دوباره گرفته نمی‌شود؛ فقط
 * لیست از `GET /api/v1/reviews` (Server-driven Pagination) Fetch می‌شود.
 */
export function ProductReviewsSheet({
  productId,
  stats,
  hasReviews,
  children,
}: {
  productId: string;
  stats: PublicReviewStats;
  hasReviews: boolean;
  /** ناحیه نظر کاربر (ثبت/نمایش/حذف) — اولین مورد پاپ‌آپ. */
  children?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [list, setList] = useState<ListState | null>(null);
  const [error, setError] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);
  const [lightboxImage, setLightboxImage] =
    useState<PublicReviewImageDTO | null>(null);
  const [loading, startTransition] = useTransition();

  // `Button` مشترک ref را نمی‌پذیرد (و عمداً تغییرش نمی‌دهیم)؛ دکمه را از Wrapper پیدا می‌کنیم.
  const triggerRef = useRef<HTMLElement | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    let cancelled = false;

    startTransition(async () => {
      try {
        const params = new URLSearchParams({
          productId,
          page: String(page),
          limit: String(PAGE_SIZE),
        });
        const res = await fetch(`/api/v1/reviews?${params}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        const body = await res.json();
        if (!res.ok || !body.success) throw new Error(body.message);
        // درخواست قدیمی هرگز نتیجه درخواست جدید را Overwrite نمی‌کند.
        if (cancelled) return;

        const totalPages: number = body.pagination?.totalPages ?? 0;
        const items: PublicReviewDTO[] = body.data.items;
        if (items.length === 0 && page > 1) {
          // صفحه دیگر وجود ندارد → آخرین صفحه معتبر.
          setPage(Math.max(1, totalPages));
          return;
        }
        setList({ items, totalPages });
        setError(false);
        scrollRef.current?.scrollTo({ top: 0 });
      } catch {
        if (!cancelled) setError(true);
      }
    });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [open, productId, page, reloadToken]);

  function openSheet() {
    setPage(1);
    setList(null);
    setError(false);
    setOpen(true);
  }

  const closeLightbox = useCallback(() => setLightboxImage(null), []);
  const closeSheet = useCallback(() => {
    setLightboxImage(null);
    setOpen(false);
  }, []);

  const initialLoading = list === null && !error;

  return (
    <>
      <div
        ref={(el) => {
          triggerRef.current = el?.querySelector("button") ?? null;
        }}
      >
        <Button
          type="button"
          variant="secondary"
          onClick={openSheet}
          aria-haspopup="dialog"
          aria-expanded={open}
          className="w-full"
        >
          {hasReviews ? "خواندن نظرات" : "ثبت اولین نظر"}
        </Button>
      </div>

      <StorefrontSheet
        open={open}
        onClose={closeSheet}
        ariaLabel="نظرات کاربران"
        returnFocusRef={triggerRef}
        closeOnEscape={lightboxImage === null}
        scrollRef={scrollRef}
        tall
        header={
          <>
            <p className="text-sm font-semibold text-[var(--sf-ink)]">
              نظرات کاربران
            </p>
            <p className="mt-0.5 text-xs text-gray-500">
              {formatSheetSubtitle(stats)}
            </p>
          </>
        }
        footer={
          list && list.totalPages > 1 ? (
            <Pagination
              page={page}
              totalPages={list.totalPages}
              onPageChange={setPage}
            />
          ) : null
        }
      >
        {children ? <div className="mb-3">{children}</div> : null}
        {error ? (
          <ErrorState
            title="دریافت نظرات ناموفق بود"
            description="لطفاً دوباره تلاش کنید."
            onRetry={() => {
              setError(false);
              setReloadToken((t) => t + 1);
            }}
          />
        ) : initialLoading ? (
          <div className="flex flex-col gap-3 pt-2" aria-busy="true">
            {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full" />
            ))}
          </div>
        ) : (
          <div
            className={
              loading ? "opacity-60 transition-opacity" : "transition-opacity"
            }
            aria-busy={loading}
          >
            {list && list.items.length === 0 ? (
              <p className="py-6 text-center text-sm text-gray-500">
                هنوز نظری ثبت نشده
              </p>
            ) : null}
            {list?.items.map((review, index) => (
              <ReviewListItem
                key={`${page}-${index}`}
                review={review}
                onImageClick={setLightboxImage}
              />
            ))}
          </div>
        )}
      </StorefrontSheet>

      <ReviewImageLightbox image={lightboxImage} onClose={closeLightbox} />
    </>
  );
}
