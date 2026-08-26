"use client";

import { useCallback, useState } from "react";
import { Wand2 } from "lucide-react";
import { generateCandidateCouponCode } from "@/lib/discounts/generate-coupon-code";

const MAX_ATTEMPTS = 5;

async function isCodeAvailable(code: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/v1/coupons/check-code?code=${encodeURIComponent(code)}`);
    const body = await res.json();
    return Boolean(body.success && body.data.available);
  } catch {
    // If the check itself fails, still hand back a candidate — the
    // create-coupon submit will reject a duplicate anyway (409), this
    // is only meant to save the common case a round trip.
    return true;
  }
}

/** Shared by the visible button below and CouponForm's auto-suggest
 * on mount, so "generate a code" has exactly one implementation. */
export function useSuggestCouponCode(discountPercentage?: number) {
  const [loading, setLoading] = useState(false);

  const suggest = useCallback(async (): Promise<string> => {
    setLoading(true);
    try {
      for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        const candidate = generateCandidateCouponCode(discountPercentage);
        if (await isCodeAvailable(candidate)) {
          return candidate;
        }
      }
      return generateCandidateCouponCode(discountPercentage);
    } finally {
      setLoading(false);
    }
  }, [discountPercentage]);

  return { suggest, loading };
}

export function CouponCodeGenerator({
  discountPercentage,
  onGenerate,
}: {
  discountPercentage?: number;
  onGenerate: (code: string) => void;
}) {
  const { suggest, loading } = useSuggestCouponCode(discountPercentage);

  return (
    <button
      type="button"
      onClick={async () => onGenerate(await suggest())}
      disabled={loading}
      className="flex w-fit items-center gap-1.5 text-xs text-primary hover:underline disabled:opacity-50"
    >
      <Wand2 className="size-3.5" />
      {loading ? "در حال بررسی..." : "پیشنهاد کد تخفیف"}
    </button>
  );
}
