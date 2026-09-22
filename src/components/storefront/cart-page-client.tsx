"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  MapPin,
  Ticket,
  X,
  CreditCard,
  Wallet as WalletIcon,
  Check,
  ShoppingCart,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { formatNumber, TOMAN_GLYPH } from "@/lib/utils/format";
import { computeWalletSplitPreview } from "@/lib/cart/wallet-split-preview";
import { CartItemRow, type CartItemData } from "@/components/storefront/cart-item-row";

type CartState = {
  id: string;
  items: CartItemData[];
  cartTotal: number;
  appliedCoupon: { code: string; discountPercentage: number } | null;
  discountAmount: number;
  grandTotal: number;
  itemCount: number;
};

type AddressSummary = {
  id: string;
  title: string;
  recipientName: string;
  phoneNumber: string;
  province: string;
  city: string;
  addressLine: string;
  postalCode: string;
  latitude: number | null;
  longitude: number | null;
} | null;

type CartPageClientProps = {
  initialCart: CartState;
  initialAddress: AddressSummary;
  walletBalance: number;
};

/** شکل استاندارد پاسخ همه Route های این پروژه (`apiSuccess`/`apiError`). */
type ApiEnvelope<T> = { success: boolean; data?: T; message?: string };

async function parseJson<T>(response: Response): Promise<ApiEnvelope<T>> {
  return (await response.json().catch(() => ({ success: false }))) as ApiEnvelope<T>;
}

export function CartPageClient({ initialCart, initialAddress, walletBalance }: CartPageClientProps) {
  const router = useRouter();

  const [cart, setCart] = useState(initialCart);
  const [itemPending, setItemPending] = useState<Record<string, boolean>>({});

  const [couponInput, setCouponInput] = useState("");
  const [couponPending, setCouponPending] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);

  const [useWallet, setUseWallet] = useState(false);
  const [checkoutPending, setCheckoutPending] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const hasUnavailableItem = cart.items.some((item) => !item.isAvailable);
  const splitPreview = computeWalletSplitPreview(walletBalance, cart.grandTotal);

  function handleUnauthorized() {
    router.push("/login?redirect=/cart");
  }

  async function updateItemQuantity(itemId: string, quantity: number) {
    if (quantity < 1) {
      return removeItem(itemId);
    }
    setItemPending((prev) => ({ ...prev, [itemId]: true }));
    try {
      const res = await fetch(`/api/v1/cart/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity }),
      });
      if (res.status === 401) return handleUnauthorized();
      const body = await parseJson<CartState>(res);
      if (res.ok && body.success && body.data) {
        setCart(body.data);
      }
    } finally {
      setItemPending((prev) => ({ ...prev, [itemId]: false }));
    }
  }

  async function removeItem(itemId: string) {
    setItemPending((prev) => ({ ...prev, [itemId]: true }));
    try {
      const res = await fetch(`/api/v1/cart/items/${itemId}`, { method: "DELETE" });
      if (res.status === 401) return handleUnauthorized();
      const body = await parseJson<CartState>(res);
      if (res.ok && body.success && body.data) {
        setCart(body.data);
      }
    } finally {
      setItemPending((prev) => ({ ...prev, [itemId]: false }));
    }
  }

  async function applyCoupon() {
    if (!couponInput.trim()) return;
    setCouponPending(true);
    setCouponError(null);
    try {
      const res = await fetch("/api/v1/cart/coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponInput.trim() }),
      });
      if (res.status === 401) return handleUnauthorized();
      const body = await parseJson<CartState>(res);
      if (!res.ok || !body.success || !body.data) {
        setCouponError(body.message ?? "این کد تخفیف قابل استفاده نیست");
        return;
      }
      setCart(body.data);
      setCouponInput("");
    } finally {
      setCouponPending(false);
    }
  }

  async function removeCoupon() {
    setCouponPending(true);
    setCouponError(null);
    try {
      const res = await fetch("/api/v1/cart/coupon", { method: "DELETE" });
      if (res.status === 401) return handleUnauthorized();
      const body = await parseJson<CartState>(res);
      if (res.ok && body.success && body.data) {
        setCart(body.data);
      }
    } finally {
      setCouponPending(false);
    }
  }

  async function handleCheckout() {
    if (!initialAddress) {
      setCheckoutError("لطفاً یک آدرس تحویل انتخاب کنید");
      return;
    }
    if (hasUnavailableItem) {
      setCheckoutError("برخی از کالاهای سبد خرید در دسترس نیستند؛ لطفاً ابتدا آن‌ها را حذف کنید");
      return;
    }

    setCheckoutPending(true);
    setCheckoutError(null);
    try {
      const res = await fetch("/api/v1/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shippingAddress: {
            recipientName: initialAddress.recipientName,
            phoneNumber: initialAddress.phoneNumber,
            province: initialAddress.province,
            city: initialAddress.city,
            addressLine: initialAddress.addressLine,
            postalCode: initialAddress.postalCode,
            ...(initialAddress.latitude !== null ? { latitude: initialAddress.latitude } : {}),
            ...(initialAddress.longitude !== null ? { longitude: initialAddress.longitude } : {}),
          },
          paymentMethod: "online",
          useWallet,
          shippingCost: 0,
        }),
      });

      if (res.status === 401) return handleUnauthorized();

      type CheckoutData = {
        order: { id: string; orderNumber: string; totalAmount: number };
        payment: { paymentUrl: string | null; paidFromWallet: boolean } | null;
        paymentError?: string;
      };
      const body = await parseJson<CheckoutData>(res);

      if (!res.ok || !body.success || !body.data) {
        setCheckoutError(body.message ?? "ثبت سفارش ممکن نشد");
        return;
      }

      const { order, payment, paymentError } = body.data;

      if (payment?.paymentUrl) {
        window.location.href = payment.paymentUrl;
        return;
      }

      if (payment?.paidFromWallet) {
        router.push(
          `/payment/result?status=success&orderNumber=${encodeURIComponent(order.orderNumber)}&amount=${order.totalAmount}`,
        );
        return;
      }

      // سفارش ثبت شد اما شروع پرداخت آنلاین با خطا مواجه شد — سبد
      // خرید سمت Backend همین الان خالی شده (checkout همیشه بعد از
      // ساخت سفارش سبد را پاک می‌کند)، پس این‌جا هم باید هم‌راستا
      // خالی نشان داده شود.
      setCart((prev) => ({ ...prev, items: [], cartTotal: 0, discountAmount: 0, grandTotal: 0, itemCount: 0, appliedCoupon: null }));
      setCheckoutError(
        paymentError ?? "سفارش شما ثبت شد اما شروع پرداخت با خطا مواجه شد؛ لطفاً بعداً دوباره تلاش کنید.",
      );
    } finally {
      setCheckoutPending(false);
    }
  }

  if (cart.items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 px-6 py-24 text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-gray-100 text-gray-300">
          <ShoppingCart className="size-7" strokeWidth={1.5} aria-hidden="true" />
        </span>
        <p className="text-sm font-bold text-[var(--sf-ink)]">سبد خرید شما خالی است</p>
        <p className="text-xs text-[var(--sf-ink)]/50">محصولی به سبد خرید خود اضافه نکرده‌اید</p>
        <Link
          href="/"
          className="mt-2 rounded-full bg-[var(--sf-accent)] px-6 py-2.5 text-xs font-bold text-white active:bg-[var(--sf-accent-hover)]"
        >
          مشاهده محصولات
        </Link>
      </div>
    );
  }

  return (
    <div className="pb-[calc(env(safe-area-inset-bottom)+96px)]">
      <div className="space-y-4 px-4 py-4 sm:px-6">
        {/* آدرس تحویل */}
        <div className="rounded-[var(--radius-lg)] border border-black/5 bg-white p-4">
          {initialAddress ? (
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[var(--sf-accent-soft)] text-[var(--sf-accent)]">
                <MapPin className="size-5" strokeWidth={1.75} aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-bold text-[var(--sf-ink)]">آدرس تحویل — {initialAddress.title}</p>
                  <Link href="/account/addresses" className="shrink-0 text-[11px] font-bold text-[var(--sf-accent)]">
                    تغییر
                  </Link>
                </div>
                <p className="mt-1 text-[11px] leading-5 text-[var(--sf-ink)]/50">
                  {initialAddress.province}، {initialAddress.city}، {initialAddress.addressLine}
                </p>
              </div>
            </div>
          ) : (
            <Link
              href="/account/addresses/new"
              className="flex items-center justify-center gap-2 rounded-[var(--radius-md)] border border-dashed border-black/15 py-3 text-xs font-bold text-[var(--sf-accent)]"
            >
              <MapPin className="size-4" strokeWidth={1.75} aria-hidden="true" />
              افزودن آدرس تحویل
            </Link>
          )}
        </div>

        {/* اقلام سبد خرید */}
        <div className="space-y-3">
          {cart.items.map((item) => (
            <CartItemRow
              key={item.id}
              item={item}
              pending={Boolean(itemPending[item.id])}
              onQuantityChange={updateItemQuantity}
              onRemove={removeItem}
            />
          ))}
        </div>

        {/* کد تخفیف */}
        <div className="rounded-[var(--radius-lg)] border border-black/5 bg-white p-4">
          <div className="mb-3 flex items-center gap-2">
            <Ticket className="size-4 text-[var(--sf-ink)]/40" strokeWidth={1.75} aria-hidden="true" />
            <p className="text-xs font-bold text-[var(--sf-ink)]">کد تخفیف</p>
          </div>

          {cart.appliedCoupon ? (
            <div className="flex items-center justify-between rounded-[var(--radius-md)] bg-[var(--color-success)]/10 px-3 py-2.5">
              <div className="flex items-center gap-2 text-xs font-bold text-[var(--color-success)]">
                <Check className="size-4" strokeWidth={2} aria-hidden="true" />
                {cart.appliedCoupon.code}
              </div>
              <button
                type="button"
                onClick={removeCoupon}
                disabled={couponPending}
                aria-label="حذف کد تخفیف"
                className="text-[var(--sf-ink)]/40 disabled:opacity-50"
              >
                <X className="size-4" strokeWidth={1.75} aria-hidden="true" />
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value)}
                placeholder="مثلاً WELCOME20"
                dir="ltr"
                className="flex-1 rounded-[var(--radius-md)] border border-black/10 bg-gray-50 px-3 py-2.5 text-left text-xs text-[var(--sf-ink)] placeholder:text-gray-400 focus:border-[var(--sf-accent)] focus:outline-none"
              />
              <button
                type="button"
                onClick={applyCoupon}
                disabled={couponPending || !couponInput.trim()}
                className="shrink-0 rounded-[var(--radius-md)] bg-[var(--sf-ink)] px-4 text-xs font-bold text-white disabled:opacity-40"
              >
                اعمال
              </button>
            </div>
          )}
          {couponError ? <p className="mt-2 text-[11px] font-medium text-danger">{couponError}</p> : null}
        </div>

        {/* روش پرداخت */}
        <div className="rounded-[var(--radius-lg)] border border-black/5 bg-white p-4">
          <p className="mb-3 text-xs font-bold text-[var(--sf-ink)]">روش پرداخت</p>
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setUseWallet(false)}
              className={cn(
                "flex w-full items-center gap-3 rounded-[var(--radius-md)] border p-3 text-right",
                !useWallet ? "border-[var(--sf-accent)] bg-[var(--sf-accent-soft)]/40" : "border-black/10",
              )}
            >
              <span
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded-full border-2",
                  !useWallet ? "border-[var(--sf-accent)] bg-[var(--sf-accent)]" : "border-gray-300",
                )}
              >
                {!useWallet && <Check className="size-3 text-white" strokeWidth={3} aria-hidden="true" />}
              </span>
              <CreditCard className="size-5 text-[var(--sf-ink)]/60" strokeWidth={1.75} aria-hidden="true" />
              <span className="flex-1">
                <span className="block text-xs font-bold text-[var(--sf-ink)]">پرداخت آنلاین</span>
                <span className="block text-[11px] text-[var(--sf-ink)]/50">پرداخت کامل مبلغ از طریق درگاه بانکی</span>
              </span>
            </button>

            <button
              type="button"
              onClick={() => setUseWallet(true)}
              disabled={walletBalance <= 0}
              className={cn(
                "flex w-full items-center gap-3 rounded-[var(--radius-md)] border p-3 text-right disabled:opacity-50",
                useWallet ? "border-[var(--sf-accent)] bg-[var(--sf-accent-soft)]/40" : "border-black/10",
              )}
            >
              <span
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded-full border-2",
                  useWallet ? "border-[var(--sf-accent)] bg-[var(--sf-accent)]" : "border-gray-300",
                )}
              >
                {useWallet && <Check className="size-3 text-white" strokeWidth={3} aria-hidden="true" />}
              </span>
              <WalletIcon className="size-5 text-[var(--sf-ink)]/60" strokeWidth={1.75} aria-hidden="true" />
              <span className="flex-1">
                <span className="block text-xs font-bold text-[var(--sf-ink)]">پرداخت ترکیبی (کیف پول + آنلاین)</span>
                <span className="block text-[11px] text-[var(--sf-ink)]/50">
                  {walletBalance > 0
                    ? `موجودی کیف پول: ${formatNumber(walletBalance)} ${TOMAN_GLYPH}`
                    : "موجودی کیف پول شما صفر است"}
                </span>
              </span>
            </button>
          </div>
        </div>

        {/* جزئیات فاکتور */}
        <div className="rounded-[var(--radius-lg)] border border-black/5 bg-white p-4">
          <p className="mb-3 text-xs font-bold text-[var(--sf-ink)]">جزئیات فاکتور</p>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between text-[var(--sf-ink)]/60">
              <span>جمع سبد خرید</span>
              <span className="text-[var(--sf-ink)]">
                {formatNumber(cart.cartTotal)} {TOMAN_GLYPH}
              </span>
            </div>
            {cart.discountAmount > 0 && (
              <div className="flex items-center justify-between text-[var(--color-success)]">
                <span>تخفیف</span>
                <span>−{formatNumber(cart.discountAmount)} {TOMAN_GLYPH}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-[var(--sf-ink)]/60">
              <span>هزینه ارسال</span>
              <span className="font-bold text-[var(--color-success)]">رایگان</span>
            </div>
            {useWallet && splitPreview.walletPortion > 0 && (
              <div className="flex items-center justify-between text-[var(--color-success)]">
                <span>پرداخت از کیف پول</span>
                <span>−{formatNumber(splitPreview.walletPortion)} {TOMAN_GLYPH}</span>
              </div>
            )}
            <div className="flex items-center justify-between border-t border-dashed border-black/10 pt-2 text-sm font-bold text-[var(--sf-ink)]">
              <span>{useWallet ? "مبلغ قابل پرداخت به درگاه" : "جمع نهایی سفارش"}</span>
              <span>
                {formatNumber(useWallet ? splitPreview.gatewayPortion : cart.grandTotal)} {TOMAN_GLYPH}
              </span>
            </div>
          </div>
        </div>

        {checkoutError ? (
          <p className="rounded-[var(--radius-md)] bg-red-50 px-3 py-2.5 text-xs font-medium text-danger">
            {checkoutError}
          </p>
        ) : null}
      </div>

      {/* نوار پایین چسبان — ثبت نهایی سفارش (هم‌الگو با ProductAddToCartBar) */}
      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-40",
          "border-t border-black/5 bg-white/95 backdrop-blur-xl",
          "px-4 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3",
        )}
      >
        <button
          type="button"
          onClick={handleCheckout}
          disabled={checkoutPending || hasUnavailableItem || !initialAddress}
          className={cn(
            "flex h-12 w-full items-center justify-between rounded-2xl px-5 text-sm font-bold text-white transition-colors",
            checkoutPending || hasUnavailableItem || !initialAddress
              ? "cursor-not-allowed bg-gray-300"
              : "bg-[var(--sf-accent)] active:bg-[var(--sf-accent-hover)]",
          )}
        >
          <span className="flex items-center gap-2">
            {checkoutPending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
            ثبت نهایی سفارش
          </span>
          <span>
            {formatNumber(useWallet ? splitPreview.gatewayPortion : cart.grandTotal)}{" "}
            <span className="text-[10px] font-medium">{TOMAN_GLYPH}</span>
          </span>
        </button>
      </div>
    </div>
  );
}
