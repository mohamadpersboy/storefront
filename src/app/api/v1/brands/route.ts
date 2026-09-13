import { connectToDatabase } from "@/lib/db/connect";
import { Brand } from "@/models/Brand";
import { PERMISSIONS } from "@/lib/constants/rbac";
import { requireApiUser } from "@/lib/auth/api-guard";
import { apiError, apiSuccess } from "@/lib/utils/api-response";
import { createBrandSchema } from "@/lib/validations/brands";

/**
 * لیست مدیریتی کامل برندها — نیاز به `BRANDS_READ` دارد (Staff+).
 * هم `BrandsManager` در Dashboard و هم Combobox انتخاب برند در فرم
 * محصول (هر دو Context احرازهویت‌شده) از همین یک Route استفاده
 * می‌کنند. برخلاف این، نمای عمومی صفحه اصلی Storefront از
 * `/api/v1/brands/homepage` (بدون Auth) می‌آید — هم‌الگو با
 * `categories`/`categories/homepage`.
 */
export async function GET() {
  const guard = await requireApiUser(PERMISSIONS.BRANDS_READ);
  if (guard.response) return guard.response;

  await connectToDatabase();
  const brands = await Brand.find().sort({ sortOrder: 1, createdAt: 1 }).lean();

  return apiSuccess(
    brands.map((b) => ({
      id: String(b._id),
      name: b.name,
      slug: b.slug,
      imageUrl: b.imageUrl,
      imageBlurDataUrl: b.imageBlurDataUrl,
      isActive: b.isActive,
      showOnHomepage: b.showOnHomepage,
      sortOrder: b.sortOrder,
    })),
  );
}

export async function POST(request: Request) {
  const guard = await requireApiUser(PERMISSIONS.BRANDS_CREATE);
  if (guard.response) return guard.response;

  const json = await request.json().catch(() => null);
  const parsed = createBrandSchema.safeParse(json);

  if (!parsed.success) {
    return apiError("اطلاعات ارسالی معتبر نیست", {
      status: 422,
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  await connectToDatabase();

  const existing = await Brand.findOne({ slug: parsed.data.slug });
  if (existing) {
    return apiError("این Slug قبلاً استفاده شده است", {
      status: 409,
      errors: { slug: ["این Slug قبلاً استفاده شده است"] },
    });
  }

  const lastBrand = await Brand.findOne().sort({ sortOrder: -1 }).lean();
  const nextSortOrder = (lastBrand?.sortOrder ?? -1) + 1;

  try {
    const brand = await Brand.create({
      ...parsed.data,
      imageUrl: parsed.data.imageUrl ?? null,
      imagePublicId: parsed.data.imagePublicId ?? null,
      imageBlurDataUrl: parsed.data.imageBlurDataUrl ?? null,
      sortOrder: nextSortOrder,
    });

    return apiSuccess(
      { id: brand.id, name: brand.name, slug: brand.slug },
      { message: "برند با موفقیت ساخته شد", status: 201 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "خطا در ساخت برند";
    return apiError(message, { status: 400 });
  }
}
