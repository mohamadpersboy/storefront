import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { connectToDatabase } from "@/lib/db/connect";
import { Address } from "@/models/Address";
import { getOrCreateCart, recalculateCart, serializeCart } from "@/lib/cart/cart-service";
import { getOrCreateWallet } from "@/lib/wallet/wallet-service";
import { getAddressDisplayTitle } from "@/lib/utils/address";
import { PageHeader } from "@/components/storefront/page-header";
import { CartPageClient } from "@/components/storefront/cart-page-client";

export const metadata = { title: "سبد خرید" };

/**
 * صفحه «سبد خرید» — طبق تصمیم معماری این Task (بند «مرحله ۶ Cart API»
 * سند Audit، از قبل کامل ساخته شده): چون Backend همین الان یک
 * `POST /api/v1/checkout` واقعی دارد که آدرس + روش پرداخت + Cart را
 * در یک درخواست به سفارش تبدیل می‌کند، این صفحه به‌جای دو صفحه مجزای
 * «سبد خرید» و «تسویه‌حساب»، دقیقاً هم‌الگوی رفرنس کارفرما یک صفحه
 * واحد است — آدرس تحویل، اقلام، کد تخفیف، روش پرداخت و ثبت نهایی
 * سفارش، همه این‌جا.
 *
 * روش پرداخت این پروژه (برخلاف رفرنس میوه‌فروشی که «پرداخت در محل»
 * داشت) فقط «پرداخت آنلاین» و «پرداخت ترکیبی» است — هر دو در واقع
 * همان `paymentMethod: "online"` سمت Backend هستند؛ تفاوتشان فقط
 * فلگ `useWallet` است (نگاه کنید `initiateOrderPayment`). گزینه
 * «پرداخت در محل»/`cash` و روش «بیعانه»/`split` (که به یک درصد
 * تأییدشده توسط ادمین نیاز دارد) عمداً در این صفحه Self-Service
 * ساخته نشدند — تصمیم معماری‌ای که این Task آن‌ها را حل نمی‌کند.
 *
 * هزینه ارسال فعلاً واقعاً صفر است — سند Audit صراحتاً می‌گوید
 * موتور محاسبه خودکار هزینه ارسال هنوز وجود ندارد و مقدار فعلی
 * سیستم (`shippingCost` پیش‌فرض Checkout) صفر است؛ این صفحه همان
 * صفر واقعی را نشان می‌دهد، نه یک عدد ساختگی.
 *
 * داده اولیه (Cart/آدرس پیش‌فرض/موجودی کیف پول) مستقیم از DB در
 * همین Server Component خوانده می‌شود (نه یک Fetch به API خودش) —
 * هم‌الگوی بقیه صفحات Storefront (مثل Hero Slider/صفحه کیف پول).
 */
export default async function CartPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?redirect=/cart");
  }

  await connectToDatabase();

  const userId = String(user._id);

  const [cartDoc, addresses, wallet] = await Promise.all([
    getOrCreateCart(userId),
    Address.find({ user: userId }).sort({ isDefault: -1, createdAt: -1 }).limit(1).lean(),
    getOrCreateWallet(userId),
  ]);

  const { productMap, discount } = await recalculateCart(cartDoc);
  await cartDoc.save();
  const cart = serializeCart(cartDoc, productMap, discount);

  const addressDoc = addresses[0] ?? null;
  const address = addressDoc
    ? {
        id: String(addressDoc._id),
        title: getAddressDisplayTitle(addressDoc),
        recipientName: addressDoc.recipientName,
        phoneNumber: addressDoc.phoneNumber,
        province: addressDoc.province,
        city: addressDoc.city,
        addressLine: addressDoc.addressLine,
        postalCode: addressDoc.postalCode,
        latitude: addressDoc.latitude ?? null,
        longitude: addressDoc.longitude ?? null,
      }
    : null;

  return (
    <div>
      <PageHeader title={`سبد خرید (${cart.itemCount.toLocaleString("fa-IR")} کالا)`} />
      <CartPageClient
        initialCart={{
          id: cart.id,
          items: cart.items,
          cartTotal: cart.cartTotal,
          appliedCoupon: cart.appliedCoupon,
          discountAmount: cart.discountAmount,
          grandTotal: cart.grandTotal,
          itemCount: cart.itemCount,
        }}
        initialAddress={address}
        walletBalance={wallet.balance}
      />
    </div>
  );
}
