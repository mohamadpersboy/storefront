import { connectToDatabase } from "@/lib/db/connect";
import { requireAuthenticatedUser } from "@/lib/auth/api-guard";
import { apiError, apiSuccess } from "@/lib/utils/api-response";
import { updateAddressSchema } from "@/lib/validations/addresses";
import { Address } from "@/models/Address";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireAuthenticatedUser();
  if (guard.response) return guard.response;

  const { id } = await params;
  if (!objectIdRegex.test(id)) {
    return apiError("آدرس یافت نشد", { status: 404 });
  }

  const json = await request.json().catch(() => null);
  const parsed = updateAddressSchema.safeParse(json);
  if (!parsed.success) {
    return apiError("اطلاعات ارسالی معتبر نیست", {
      status: 422,
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  await connectToDatabase();

  // مالکیت با `user: guard.user.id` در همان Query چک می‌شود، نه با
  // یک `if` جدا بعد از findById — یعنی کاربر دیگری حتی نمی‌تواند با
  // حدس‌زدن id، وجود/عدم‌وجود آدرس کاربر دیگر را تشخیص دهد.
  const address = await Address.findOne({ _id: id, user: guard.user.id });
  if (!address) {
    return apiError("آدرس یافت نشد", { status: 404 });
  }

  if (parsed.data.isDefault) {
    await Address.updateMany(
      { user: guard.user.id, _id: { $ne: address._id } },
      { $set: { isDefault: false } },
    );
  }

  Object.assign(address, parsed.data);
  await address.save();

  return apiSuccess(
    { id: String(address._id) },
    { message: "آدرس با موفقیت ویرایش شد" },
  );
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireAuthenticatedUser();
  if (guard.response) return guard.response;

  const { id } = await params;
  if (!objectIdRegex.test(id)) {
    return apiError("آدرس یافت نشد", { status: 404 });
  }
  await connectToDatabase();

  const address = await Address.findOneAndDelete({ _id: id, user: guard.user.id });
  if (!address) {
    return apiError("آدرس یافت نشد", { status: 404 });
  }

  // اگر آدرس حذف‌شده پیش‌فرض بود، جدیدترین آدرس باقی‌مانده (اگر
  // باشد) خودکار پیش‌فرض جدید می‌شود — کاربر هرگز با «هیچ آدرس
  // پیش‌فرضی» تنها نمی‌ماند در حالی که آدرس دیگری دارد.
  if (address.isDefault) {
    const next = await Address.findOne({ user: guard.user.id }).sort({ createdAt: -1 });
    if (next) {
      next.isDefault = true;
      await next.save();
    }
  }

  return apiSuccess({ id: String(address._id) }, { message: "آدرس حذف شد" });
}
