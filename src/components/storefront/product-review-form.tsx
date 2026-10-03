"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ReviewImagePicker } from "@/components/storefront/review-image-picker";
import { ReviewRatingInput } from "@/components/storefront/review-rating-input";
import {
  REVIEW_RECOMMENDATION_LABELS,
  REVIEW_RECOMMENDATIONS,
  REVIEW_TEXT_MAX,
  type ReviewRecommendation,
} from "@/lib/reviews/constants";
import {
  buildReviewPayload,
  type ReviewFormErrors,
  type ReviewFormImage,
  type ReviewPayload,
} from "@/lib/storefront/review-form";
import { mapReviewSubmitError } from "@/lib/storefront/review-form-messages";
import { toPersianDigits } from "@/lib/utils/format";

/**
 * فرم ثبت نظر. Backend منبع حقیقت است؛ اعتبارسنجی Client فقط UX است.
 * فقط productId/rating/recommendation/text/images ارسال می‌شود.
 */
export function ProductReviewForm({
  productId,
  canAddImages,
  onSubmitted,
}: {
  productId: string;
  canAddImages: boolean;
  onSubmitted: (id: string, payload: ReviewPayload) => void;
}) {
  const router = useRouter();
  const uid = useId();
  const ratingLabelId = `${uid}-rating`;
  const recLabelId = `${uid}-rec`;
  const textId = `${uid}-text`;

  const [rating, setRating] = useState<number | null>(null);
  const [recommendation, setRecommendation] =
    useState<ReviewRecommendation | null>(null);
  const [text, setText] = useState("");
  const [images, setImages] = useState<ReviewFormImage[]>([]);
  const [errors, setErrors] = useState<ReviewFormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (submitting) return;
    setFormError(null);

    const built = buildReviewPayload({
      productId,
      rating,
      recommendation,
      text,
      images,
    });
    if (!built.ok) {
      setErrors(built.errors);
      return;
    }
    setErrors({});
    setSubmitting(true);

    let status = 0;
    let id: string | null = null;
    try {
      const res = await fetch("/api/v1/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(built.payload),
      });
      status = res.status;
      if (res.ok) {
        const body = await res.json().catch(() => null);
        id = typeof body?.data?.id === "string" ? body.data.id : null;
      }
    } catch {
      status = 0;
    }

    if (status === 201 && id) {
      onSubmitted(id, built.payload);
      return;
    }

    const mapped = mapReviewSubmitError(status);
    setFormError(mapped.message);
    setSubmitting(false);
    if (mapped.refresh) router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <p
          id={ratingLabelId}
          className="text-sm font-medium text-[var(--sf-ink)]"
        >
          امتیاز شما
        </p>
        <ReviewRatingInput
          value={rating}
          onChange={setRating}
          disabled={submitting}
          labelledBy={ratingLabelId}
          invalid={Boolean(errors.rating)}
        />
        {errors.rating ? (
          <p role="alert" className="text-xs text-red-600">
            {errors.rating}
          </p>
        ) : null}
      </div>

      <fieldset className="flex flex-col gap-1.5" disabled={submitting}>
        <legend
          id={recLabelId}
          className="mb-1.5 text-sm font-medium text-[var(--sf-ink)]"
        >
          آیا این محصول را توصیه می‌کنید؟
        </legend>
        <div className="flex flex-col gap-2">
          {REVIEW_RECOMMENDATIONS.map((value) => (
            <label
              key={value}
              className="flex items-center gap-2 text-sm text-[var(--sf-ink)]"
            >
              <input
                type="radio"
                name={`${uid}-recommendation`}
                value={value}
                checked={recommendation === value}
                onChange={() => setRecommendation(value)}
                className="size-4 accent-[var(--sf-accent)]"
              />
              {REVIEW_RECOMMENDATION_LABELS[value]}
            </label>
          ))}
        </div>
        {errors.recommendation ? (
          <p role="alert" className="text-xs text-red-600">
            {errors.recommendation}
          </p>
        ) : null}
      </fieldset>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor={textId}
          className="text-sm font-medium text-[var(--sf-ink)]"
        >
          متن نظر
        </label>
        <Textarea
          id={textId}
          rows={5}
          value={text}
          disabled={submitting}
          onChange={(e) => setText(e.target.value)}
          aria-invalid={Boolean(errors.text) || undefined}
          placeholder="تجربه خود را بنویسید"
        />
        <p
          className={`text-xs ${text.length > REVIEW_TEXT_MAX ? "text-red-600" : "text-gray-500"}`}
          aria-live="polite"
        >
          {toPersianDigits(text.length)} از {toPersianDigits(REVIEW_TEXT_MAX)}
        </p>
        {errors.text ? (
          <p role="alert" className="text-xs text-red-600">
            {errors.text}
          </p>
        ) : null}
      </div>

      {canAddImages ? (
        <div className="flex flex-col gap-1.5">
          <p className="text-sm font-medium text-[var(--sf-ink)]">
            تصویر (اختیاری)
          </p>
          <ReviewImagePicker
            productId={productId}
            images={images}
            onChange={setImages}
            disabled={submitting}
          />
          {errors.images ? (
            <p role="alert" className="text-xs text-red-600">
              {errors.images}
            </p>
          ) : null}
        </div>
      ) : null}

      {formError ? (
        <p role="alert" className="text-sm text-red-600">
          {formError}
        </p>
      ) : null}

      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? "در حال ثبت…" : "ثبت نظر"}
      </Button>
    </form>
  );
}
