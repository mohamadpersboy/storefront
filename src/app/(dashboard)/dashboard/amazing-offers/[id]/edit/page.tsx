import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { AmazingOfferForm } from "@/components/amazing-offers/amazing-offer-form";
import { connectToDatabase } from "@/lib/db/connect";
import { AmazingOffer } from "@/models/AmazingOffer";
import { Product } from "@/models/Product";

export default async function EditAmazingOfferPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  await connectToDatabase();
  const offer = await AmazingOffer.findById(id).lean().catch(() => null);
  if (!offer) {
    notFound();
  }

  const product = await Product.findById(offer.productId).select("title variants").lean();
  const variant = product?.variants.find((v) => String(v._id) === String(offer.variantId));

  return (
    <div className="flex flex-col gap-4">
      <Link
        href="/dashboard/amazing-offers"
        className="flex w-fit items-center gap-1 text-sm text-muted hover:text-foreground"
      >
        <ChevronRight className="size-4" />
        بازگشت به لیست
      </Link>
      <AmazingOfferForm
        mode="edit"
        initial={{
          id: String(offer._id),
          productTitle: product?.title ?? "محصول حذف‌شده",
          variantLabel: variant
            ? [variant.unit, ...variant.attributes.map((a) => a.value)].join(" · ")
            : "Variant حذف‌شده",
          discountType: offer.discountType,
          discountValue: offer.discountValue,
          startAt: offer.startAt.toISOString(),
          endAt: offer.endAt.toISOString(),
          isActive: offer.isActive,
          basePrice: variant?.price ?? 0,
        }}
      />
    </div>
  );
}
