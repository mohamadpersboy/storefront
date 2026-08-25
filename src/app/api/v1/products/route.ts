import type { NextRequest } from "next/server";
import type { Types } from "mongoose";
import { connectToDatabase } from "@/lib/db/connect";
import { Product, type IProduct } from "@/models/Product";
import { Category } from "@/models/Category";
import { PERMISSIONS } from "@/lib/constants/rbac";
import { requireApiUser } from "@/lib/auth/api-guard";
import { apiError, apiSuccess } from "@/lib/utils/api-response";
import { computeFinalPrice } from "@/lib/utils/pricing";
import {
  createProductSchema,
  productsListQuerySchema,
} from "@/lib/validations/products";

type LeanProduct = IProduct & {
  _id: Types.ObjectId;
  category: { _id: Types.ObjectId; name: string; slug: string } | Types.ObjectId;
};

export async function GET(request: NextRequest) {
  const guard = await requireApiUser(PERMISSIONS.PRODUCTS_READ);
  if (guard.response) return guard.response;

  const { searchParams } = request.nextUrl;
  const parsed = productsListQuerySchema.safeParse({
    page: searchParams.get("page") ?? undefined,
    limit: searchParams.get("limit") ?? undefined,
    search: searchParams.get("search") ?? undefined,
    category: searchParams.get("category") ?? undefined,
    status: searchParams.get("status") ?? undefined,
    hasDiscount: searchParams.get("hasDiscount") ?? undefined,
  });

  if (!parsed.success) {
    return apiError("پارامترهای جستجو معتبر نیستند", {
      status: 422,
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  const { page, limit, search, category, status, hasDiscount } = parsed.data;
  await connectToDatabase();

  const filter: Record<string, unknown> = {};
  if (category) filter.category = category;
  if (status) filter.status = status;
  if (search) {
    const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.title = { $regex: escaped, $options: "i" };
  }
  if (hasDiscount) {
    filter.$or = [
      { "variants.discountPercent": { $gt: 0 } },
      { "variants.discountAmount": { $gt: 0 } },
    ];
  }

  const result = await Product.paginate(filter, {
    page,
    limit,
    sort: { createdAt: -1 },
    populate: { path: "category", select: "name slug" },
    lean: true,
  });

  return apiSuccess(
    (result.docs as LeanProduct[]).map((p) => {
      const prices = p.variants.map((v) =>
        computeFinalPrice(v.price, v.discountPercent, v.discountAmount),
      );
      const totalStock = p.variants.reduce((sum, v) => sum + v.stock, 0);
      const discountedVariantsCount = p.variants.filter(
        (v) => v.discountPercent > 0 || v.discountAmount > 0,
      ).length;
      return {
        id: String(p._id),
        title: p.title,
        slug: p.slug,
        category: p.category,
        status: p.status,
        coverImage: p.images[0]?.url ?? null,
        variantsCount: p.variants.length,
        discountedVariantsCount,
        minPrice: prices.length ? Math.min(...prices) : 0,
        totalStock,
        createdAt: p.createdAt,
      };
    }),
    {
      pagination: {
        totalDocs: result.totalDocs,
        totalPages: result.totalPages,
        page: result.page ?? page,
        limit: result.limit,
        hasNextPage: result.hasNextPage,
        hasPrevPage: result.hasPrevPage,
      },
    },
  );
}

export async function POST(request: Request) {
  const guard = await requireApiUser(PERMISSIONS.PRODUCTS_CREATE);
  if (guard.response) return guard.response;

  const json = await request.json().catch(() => null);
  const parsed = createProductSchema.safeParse(json);

  if (!parsed.success) {
    return apiError("اطلاعات ارسالی معتبر نیست", {
      status: 422,
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  await connectToDatabase();

  const [existingSlug, categoryDoc] = await Promise.all([
    Product.findOne({ slug: parsed.data.slug }),
    Category.findById(parsed.data.category),
  ]);

  if (existingSlug) {
    return apiError("این Slug قبلاً استفاده شده است", {
      status: 409,
      errors: { slug: ["این Slug قبلاً استفاده شده است"] },
    });
  }

  if (!categoryDoc) {
    return apiError("دسته‌بندی انتخاب‌شده معتبر نیست", {
      status: 400,
      errors: { category: ["دسته‌بندی انتخاب‌شده معتبر نیست"] },
    });
  }

  try {
    const product = await Product.create(parsed.data);
    return apiSuccess(
      { id: product.id, title: product.title, slug: product.slug },
      { message: "محصول با موفقیت ساخته شد", status: 201 },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "خطا در ساخت محصول";
    return apiError(message, { status: 400 });
  }
}
