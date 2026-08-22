import { connectToDatabase } from "@/lib/db/connect";
import { Category } from "@/models/Category";
import { PERMISSIONS } from "@/lib/constants/rbac";
import { requireApiUser } from "@/lib/auth/api-guard";
import { apiError, apiSuccess } from "@/lib/utils/api-response";
import { createCategorySchema } from "@/lib/validations/categories";
import { validateCategoryParent } from "@/lib/validations/category-depth";

export async function GET() {
  const guard = await requireApiUser(PERMISSIONS.CATEGORIES_READ);
  if (guard.response) return guard.response;

  await connectToDatabase();
  const categories = await Category.find()
    .sort({ sortOrder: 1, createdAt: 1 })
    .lean();

  return apiSuccess(
    categories.map((c) => ({
      id: String(c._id),
      name: c.name,
      slug: c.slug,
      parentId: c.parentId ? String(c.parentId) : null,
      isActive: c.isActive,
      sortOrder: c.sortOrder,
    })),
  );
}

export async function POST(request: Request) {
  const guard = await requireApiUser(PERMISSIONS.CATEGORIES_CREATE);
  if (guard.response) return guard.response;

  const json = await request.json().catch(() => null);
  const parsed = createCategorySchema.safeParse(json);

  if (!parsed.success) {
    return apiError("اطلاعات ارسالی معتبر نیست", {
      status: 422,
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  await connectToDatabase();

  const existing = await Category.findOne({ slug: parsed.data.slug });
  if (existing) {
    return apiError("این Slug قبلاً استفاده شده است", {
      status: 409,
      errors: { slug: ["این Slug قبلاً استفاده شده است"] },
    });
  }

  const parentError = await validateCategoryParent(parsed.data.parentId);
  if (parentError) {
    return apiError(parentError, {
      status: 400,
      errors: { parentId: [parentError] },
    });
  }

  try {
    const category = await Category.create({
      ...parsed.data,
      parentId: parsed.data.parentId || null,
    });

    return apiSuccess(
      { id: category.id, name: category.name, slug: category.slug },
      { message: "دسته‌بندی با موفقیت ساخته شد", status: 201 },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "خطا در ساخت دسته‌بندی";
    return apiError(message, { status: 400 });
  }
}
