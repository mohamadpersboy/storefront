import { connectToDatabase } from "@/lib/db/connect";
import { Brand } from "@/models/Brand";
import { Product } from "@/models/Product";
import { PERMISSIONS } from "@/lib/constants/rbac";
import { requireApiUser } from "@/lib/auth/api-guard";
import { apiError, apiSuccess } from "@/lib/utils/api-response";
import { updateBrandSchema } from "@/lib/validations/brands";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireApiUser(PERMISSIONS.BRANDS_UPDATE);
  if (guard.response) return guard.response;

  const { id } = await params;
  const json = await request.json().catch(() => null);
  const parsed = updateBrandSchema.safeParse(json);

  if (!parsed.success) {
    return apiError("اطلاعات ارسالی معتبر نیست", {
      status: 422,
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  await connectToDatabase();
  const brand = await Brand.findById(id);

  if (!brand) {
    return apiError("برند یافت نشد", { status: 404 });
  }

  if (parsed.data.slug && parsed.data.slug !== brand.slug) {
    const existing = await Brand.findOne({
      slug: parsed.data.slug,
      _id: { $ne: brand._id },
    });
    if (existing) {
      return apiError("این Slug قبلاً استفاده شده است", {
        status: 409,
        errors: { slug: ["این Slug قبلاً استفاده شده است"] },
      });
    }
  }

  Object.assign(brand, parsed.data);

  try {
    await brand.save();
  } catch (error) {
    const message = error instanceof Error ? error.message : "خطا در ویرایش برند";
    return apiError(message, { status: 400 });
  }

  return apiSuccess(
    { id: brand.id, name: brand.name, slug: brand.slug },
    { message: "برند با موفقیت ویرایش شد" },
  );
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireApiUser(PERMISSIONS.BRANDS_DELETE);
  if (guard.response) return guard.response;

  const { id } = await params;
  await connectToDatabase();

  const brand = await Brand.findById(id);
  if (!brand) {
    return apiError("برند یافت نشد", { status: 404 });
  }

  // برند حذف می‌شود ولی محصولاتی که به آن اشاره می‌کردند حذف/خراب
  // نمی‌شوند — فقط ارجاعشان به `null` (بدون برند) برمی‌گردد. مشابه
  // فلسفه Soft Delete محصول: از بین رفتن یک Entity مرجع نباید داده‌ی
  // دیگری را در وضعیت نامعتبر (اشاره به شناسه‌ای که دیگر وجود ندارد)
  // رها کند.
  await Product.updateMany({ brand: brand._id }, { $set: { brand: null } });
  await brand.deleteOne();

  return apiSuccess({ id }, { message: "برند حذف شد" });
}
