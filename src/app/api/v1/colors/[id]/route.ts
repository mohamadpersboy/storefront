import { connectToDatabase } from "@/lib/db/connect";
import { Color } from "@/models/Color";
import { Product } from "@/models/Product";
import { PERMISSIONS } from "@/lib/constants/rbac";
import { requireApiUser } from "@/lib/auth/api-guard";
import { apiError, apiSuccess } from "@/lib/utils/api-response";
import { updateColorSchema } from "@/lib/validations/colors";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireApiUser(PERMISSIONS.COLORS_MANAGE);
  if (guard.response) return guard.response;

  const { id } = await params;
  const json = await request.json().catch(() => null);
  const parsed = updateColorSchema.safeParse(json);

  if (!parsed.success) {
    return apiError("اطلاعات ارسالی معتبر نیست", {
      status: 422,
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  await connectToDatabase();
  const color = await Color.findById(id);

  if (!color) {
    return apiError("رنگ یافت نشد", { status: 404 });
  }

  if (parsed.data.name && parsed.data.name !== color.name) {
    const existing = await Color.findOne({
      name: parsed.data.name,
      _id: { $ne: color._id },
    });
    if (existing) {
      return apiError("رنگی با این نام قبلاً ثبت شده است", {
        status: 409,
        errors: { name: ["رنگی با این نام قبلاً ثبت شده است"] },
      });
    }
  }

  Object.assign(color, parsed.data);
  await color.save();

  return apiSuccess(
    { id: color.id, name: color.name, hexCode: color.hexCode },
    { message: "رنگ با موفقیت ویرایش شد" },
  );
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireApiUser(PERMISSIONS.COLORS_MANAGE);
  if (guard.response) return guard.response;

  const { id } = await params;
  await connectToDatabase();

  const color = await Color.findById(id);
  if (!color) {
    return apiError("رنگ یافت نشد", { status: 404 });
  }

  const usedByProduct = await Product.exists({ "variants.colorId": id });
  if (usedByProduct) {
    return apiError(
      "این رنگ در حال حاضر روی حداقل یک محصول استفاده شده و قابل حذف نیست",
      { status: 409 },
    );
  }

  await color.deleteOne();
  return apiSuccess({ id }, { message: "رنگ حذف شد" });
}
