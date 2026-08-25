import { connectToDatabase } from "@/lib/db/connect";
import { AmazingOffer, type IAmazingOffer } from "@/models/AmazingOffer";
import type { IProduct } from "@/models/Product";
import "@/models/Product"; // registers the "Product" model for populate() below
import type { Types } from "mongoose";
import { PERMISSIONS } from "@/lib/constants/rbac";
import { requireApiUser } from "@/lib/auth/api-guard";
import { apiError, apiSuccess } from "@/lib/utils/api-response";
import { updateAmazingOfferSchema } from "@/lib/validations/amazing-offers";
import { computeAmazingOfferPrice, getAmazingOfferStatus } from "@/lib/utils/amazing-offer";

type LeanOffer = IAmazingOffer & {
  _id: Types.ObjectId;
  productId:
    | (Pick<IProduct, "title" | "slug" | "images" | "variants"> & { _id: Types.ObjectId })
    | Types.ObjectId
    | null;
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireApiUser(PERMISSIONS.DISCOUNTS_READ);
  if (guard.response) return guard.response;

  const { id } = await params;
  await connectToDatabase();

  const offer = (await AmazingOffer.findById(id)
    .populate({ path: "productId", select: "title slug images variants" })
    .lean()) as LeanOffer | null;
  if (!offer) {
    return apiError("تخفیف شگفت‌انگیز یافت نشد", { status: 404 });
  }

  const product =
    offer.productId && typeof offer.productId === "object" && "variants" in offer.productId
      ? offer.productId
      : null;
  const variant = product?.variants.find((v) => String(v._id) === String(offer.variantId));

  return apiSuccess({
    id: String(offer._id),
    product: product
      ? { id: String(product._id), title: product.title, slug: product.slug }
      : null,
    variant: variant
      ? { id: String(variant._id), unit: variant.unit, basePrice: variant.price }
      : null,
    discountType: offer.discountType,
    discountValue: offer.discountValue,
    finalPrice: variant
      ? computeAmazingOfferPrice(variant.price, offer.discountType, offer.discountValue)
      : null,
    startAt: offer.startAt,
    endAt: offer.endAt,
    isActive: offer.isActive,
    status: getAmazingOfferStatus(offer),
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireApiUser(PERMISSIONS.DISCOUNTS_MANAGE);
  if (guard.response) return guard.response;

  const { id } = await params;
  const json = await request.json().catch(() => null);
  const parsed = updateAmazingOfferSchema.safeParse(json);

  if (!parsed.success) {
    return apiError("اطلاعات ارسالی معتبر نیست", {
      status: 422,
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  await connectToDatabase();
  const offer = await AmazingOffer.findById(id);
  if (!offer) {
    return apiError("تخفیف شگفت‌انگیز یافت نشد", { status: 404 });
  }

  const nextType = parsed.data.discountType ?? offer.discountType;
  const nextValue = parsed.data.discountValue ?? offer.discountValue;
  if (nextType === "percent" && nextValue > 100) {
    return apiError("درصد تخفیف نمی‌تواند بیشتر از ۱۰۰ باشد", {
      status: 422,
      errors: { discountValue: ["درصد تخفیف نمی‌تواند بیشتر از ۱۰۰ باشد"] },
    });
  }

  Object.assign(offer, parsed.data);
  await offer.save();

  return apiSuccess({ id: offer.id }, { message: "تخفیف شگفت‌انگیز ویرایش شد" });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireApiUser(PERMISSIONS.DISCOUNTS_MANAGE);
  if (guard.response) return guard.response;

  const { id } = await params;
  await connectToDatabase();

  const offer = await AmazingOffer.findById(id);
  if (!offer) {
    return apiError("تخفیف شگفت‌انگیز یافت نشد", { status: 404 });
  }

  await offer.deleteOne();
  return apiSuccess({ id }, { message: "تخفیف شگفت‌انگیز حذف شد" });
}
