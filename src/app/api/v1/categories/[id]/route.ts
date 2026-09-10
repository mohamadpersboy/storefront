import { connectToDatabase } from "@/lib/db/connect";
import { Category } from "@/models/Category";
import { PERMISSIONS } from "@/lib/constants/rbac";
import { requireApiUser } from "@/lib/auth/api-guard";
import { apiError, apiSuccess } from "@/lib/utils/api-response";
import { updateCategorySchema } from "@/lib/validations/categories";
import { validateCategoryParent } from "@/lib/validations/category-depth";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireApiUser(PERMISSIONS.CATEGORIES_READ);
  if (guard.response) return guard.response;

  const { id } = await params;
  await connectToDatabase();

  const category = await Category.findById(id).lean();
  if (!category) {
    return apiError("دسته‌بندی یافت نشد", { status: 404 });
  }

  return apiSuccess({
    id: String(category._id),
    name: category.name,
    slug: category.slug,
    parentId: category.parentId ? String(category.parentId) : null,
    isActive: category.isActive,
    sortOrder: category.sortOrder,
    imageUrl: category.imageUrl,
    imageBlurDataUrl: category.imageBlurDataUrl,
    showOnHomepage: category.showOnHomepage,
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireApiUser(PERMISSIONS.CATEGORIES_UPDATE);
  if (guard.response) return guard.response;

  const { id } = await params;
  const json = await request.json().catch(() => null);
  const parsed = updateCategorySchema.safeParse(json);

  if (!parsed.success) {
    return apiError("اطلاعات ارسالی معتبر نیست", {
      status: 422,
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  await connectToDatabase();
  const category = await Category.findById(id);

  if (!category) {
    return apiError("دسته‌بندی یافت نشد", { status: 404 });
  }

  if (parsed.data.slug && parsed.data.slug !== category.slug) {
    const existing = await Category.findOne({
      slug: parsed.data.slug,
      _id: { $ne: category._id },
    });
    if (existing) {
      return apiError("این Slug قبلاً استفاده شده است", {
        status: 409,
        errors: { slug: ["این Slug قبلاً استفاده شده است"] },
      });
    }
  }

  if (parsed.data.parentId !== undefined) {
    const parentError = await validateCategoryParent(
      parsed.data.parentId,
      id,
    );
    if (parentError) {
      return apiError(parentError, {
        status: 400,
        errors: { parentId: [parentError] },
      });
    }
  }

  Object.assign(category, {
    ...parsed.data,
    ...(parsed.data.parentId !== undefined
      ? { parentId: parsed.data.parentId || null }
      : {}),
  });

  // تصویر و «نمایش در صفحه اصلی» فقط برای دسته‌بندی سطح اول معنا
  // دارد. وضعیت نهایی `parentId` (چه از این درخواست، چه از قبل در
  // DB) تعیین‌کننده است، نه فقط مقدار ارسالی همین درخواست.
  if (category.parentId) {
    category.imageUrl = null;
    category.imagePublicId = null;
    category.imageBlurDataUrl = null;
    category.showOnHomepage = false;
  }

  try {
    await category.save();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "خطا در ویرایش دسته‌بندی";
    return apiError(message, { status: 400 });
  }

  return apiSuccess(
    { id: category.id, name: category.name, slug: category.slug },
    { message: "دسته‌بندی با موفقیت ویرایش شد" },
  );
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireApiUser(PERMISSIONS.CATEGORIES_DELETE);
  if (guard.response) return guard.response;

  const { id } = await params;
  await connectToDatabase();

  const category = await Category.findById(id);
  if (!category) {
    return apiError("دسته‌بندی یافت نشد", { status: 404 });
  }

  // Cascade: a deleted parent takes its children with it (max-depth-2
  // means "children" here can only ever be direct, one level deep).
  await Category.deleteMany({ parentId: category._id });
  await category.deleteOne();

  return apiSuccess({ id }, { message: "دسته‌بندی حذف شد" });
}
