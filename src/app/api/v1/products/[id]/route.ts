import { connectToDatabase } from "@/lib/db/connect";
import { Product } from "@/models/Product";
import { Category } from "@/models/Category";
import { PERMISSIONS } from "@/lib/constants/rbac";
import { requireApiUser } from "@/lib/auth/api-guard";
import { apiError, apiSuccess } from "@/lib/utils/api-response";
import { updateProductSchema } from "@/lib/validations/products";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireApiUser(PERMISSIONS.PRODUCTS_READ);
  if (guard.response) return guard.response;

  const { id } = await params;
  await connectToDatabase();

  const product = await Product.findById(id).lean();
  if (!product) {
    return apiError("محصول یافت نشد", { status: 404 });
  }

  return apiSuccess({
    id: String(product._id),
    title: product.title,
    slug: product.slug,
    description: product.description ?? "",
    technicalDescription: product.technicalDescription ?? "",
    technicalSpecifications: product.technicalSpecifications,
    category: String(product.category),
    images: product.images,
    variants: product.variants.map((v) => ({
      id: String(v._id),
      unit: v.unit,
      attributes: v.attributes,
      sku: v.sku ?? "",
      price: v.price,
      discountPercent: v.discountPercent,
      discountAmount: v.discountAmount,
      stock: v.stock,
      isActive: v.isActive,
    })),
    status: product.status,
    seo: product.seo ?? {},
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireApiUser(PERMISSIONS.PRODUCTS_UPDATE);
  if (guard.response) return guard.response;

  const { id } = await params;
  const json = await request.json().catch(() => null);
  const parsed = updateProductSchema.safeParse(json);

  if (!parsed.success) {
    return apiError("اطلاعات ارسالی معتبر نیست", {
      status: 422,
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  await connectToDatabase();
  const product = await Product.findById(id);

  if (!product) {
    return apiError("محصول یافت نشد", { status: 404 });
  }

  if (parsed.data.slug && parsed.data.slug !== product.slug) {
    const existing = await Product.findOne({
      slug: parsed.data.slug,
      _id: { $ne: product._id },
    });
    if (existing) {
      return apiError("این Slug قبلاً استفاده شده است", {
        status: 409,
        errors: { slug: ["این Slug قبلاً استفاده شده است"] },
      });
    }
  }

  if (parsed.data.category) {
    const categoryDoc = await Category.findById(parsed.data.category);
    if (!categoryDoc) {
      return apiError("دسته‌بندی انتخاب‌شده معتبر نیست", {
        status: 400,
        errors: { category: ["دسته‌بندی انتخاب‌شده معتبر نیست"] },
      });
    }
  }

  Object.assign(product, parsed.data);

  try {
    await product.save();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "خطا در ویرایش محصول";
    return apiError(message, { status: 400 });
  }

  return apiSuccess(
    { id: product.id, title: product.title, slug: product.slug },
    { message: "محصول با موفقیت ویرایش شد" },
  );
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireApiUser(PERMISSIONS.PRODUCTS_DELETE);
  if (guard.response) return guard.response;

  const { id } = await params;
  await connectToDatabase();

  const product = await Product.findById(id);
  if (!product) {
    return apiError("محصول یافت نشد", { status: 404 });
  }

  // Soft delete only — Cloudinary images are intentionally NOT removed
  // here so a soft-deleted product can still be restored with its
  // images intact. Permanent deletion (and the matching Cloudinary
  // cleanup) is a separate, not-yet-built admin action.
  product.deletedAt = new Date();
  await product.save();

  return apiSuccess({ id }, { message: "محصول حذف شد" });
}
