import type { NextRequest } from "next/server";
import type { Types } from "mongoose";
import { connectToDatabase } from "@/lib/db/connect";
import { AmazingOffer, type IAmazingOffer } from "@/models/AmazingOffer";
import { Product, type IProduct } from "@/models/Product";
import { PERMISSIONS } from "@/lib/constants/rbac";
import { requireApiUser } from "@/lib/auth/api-guard";
import { apiError, apiSuccess } from "@/lib/utils/api-response";
import { createAmazingOfferSchema } from "@/lib/validations/amazing-offers";
import { computeAmazingOfferPrice, getAmazingOfferStatus } from "@/lib/utils/amazing-offer";
import { logActivity } from "@/lib/audit/log-activity";

type LeanOffer = IAmazingOffer & {
  _id: Types.ObjectId;
  productId:
    | (Pick<IProduct, "title" | "slug" | "images" | "variants"> & { _id: Types.ObjectId })
    | Types.ObjectId
    | null;
};

const STATUS_VALUES = ["active", "scheduled", "expired", "paused"] as const;

function serialize(offer: LeanOffer) {
  const product =
    offer.productId && typeof offer.productId === "object" && "variants" in offer.productId
      ? offer.productId
      : null;
  const variant = product?.variants.find((v) => String(v._id) === String(offer.variantId));

  return {
    id: String(offer._id),
    product: product
      ? { id: String(product._id), title: product.title, slug: product.slug }
      : null,
    variant: variant
      ? {
          id: String(variant._id),
          unit: variant.unit,
          attributes: variant.attributes ?? [],
          basePrice: variant.price,
        }
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
  };
}

export async function GET(request: NextRequest) {
  const guard = await requireApiUser(PERMISSIONS.DISCOUNTS_READ);
  if (guard.response) return guard.response;

  const { searchParams } = request.nextUrl;
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 20));
  const status = searchParams.get("status");

  await connectToDatabase();

  const now = new Date();
  const filter: Record<string, unknown> = {};
  if (status && (STATUS_VALUES as readonly string[]).includes(status)) {
    if (status === "paused") {
      filter.isActive = false;
    } else if (status === "scheduled") {
      filter.isActive = true;
      filter.startAt = { $gt: now };
    } else if (status === "active") {
      filter.isActive = true;
      filter.startAt = { $lte: now };
      filter.endAt = { $gte: now };
    } else if (status === "expired") {
      filter.isActive = true;
      filter.endAt = { $lt: now };
    }
  }

  const result = await AmazingOffer.paginate(filter, {
    page,
    limit,
    sort: { endAt: 1 },
    populate: { path: "productId", select: "title slug images variants" },
    lean: true,
  });

  return apiSuccess((result.docs as LeanOffer[]).map(serialize), {
    pagination: {
      totalDocs: result.totalDocs,
      totalPages: result.totalPages,
      page: result.page ?? page,
      limit: result.limit,
      hasNextPage: result.hasNextPage,
      hasPrevPage: result.hasPrevPage,
    },
  });
}

export async function POST(request: Request) {
  const guard = await requireApiUser(PERMISSIONS.DISCOUNTS_MANAGE);
  if (guard.response) return guard.response;
  const { user: actor } = guard;

  const json = await request.json().catch(() => null);
  const parsed = createAmazingOfferSchema.safeParse(json);

  if (!parsed.success) {
    return apiError("اطلاعات ارسالی معتبر نیست", {
      status: 422,
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  const { productId, variantId, discountType, discountValue, startAt, endAt } = parsed.data;
  await connectToDatabase();

  const product = await Product.findById(productId).select("variants").lean();
  if (!product) {
    return apiError("محصول یافت نشد", { status: 404 });
  }
  const variant = product.variants.find((v) => String(v._id) === variantId);
  if (!variant) {
    return apiError("Variant انتخاب‌شده متعلق به این محصول نیست", { status: 422 });
  }

  const now = new Date();
  const overlapping = await AmazingOffer.findOne({
    variantId,
    isActive: true,
    endAt: { $gt: now },
  });
  if (overlapping) {
    return apiError(
      "این Variant در حال حاضر یک تخفیف شگفت‌انگیز فعال یا زمان‌بندی‌شده دیگر دارد",
      { status: 409 },
    );
  }

  const offer = await AmazingOffer.create({
    productId,
    variantId,
    discountType,
    discountValue,
    startAt,
    endAt,
  });

  await logActivity({
    actor,
    action: "amazing_offer.created",
    targetType: "AmazingOffer",
    targetId: offer.id,
    description: `تخفیف شگفت‌انگیز جدید ثبت شد (${
      discountType === "percent" ? `${discountValue}٪` : `${discountValue} تومان`
    })`,
  });

  return apiSuccess({ id: offer.id }, { message: "تخفیف شگفت‌انگیز ثبت شد", status: 201 });
}
