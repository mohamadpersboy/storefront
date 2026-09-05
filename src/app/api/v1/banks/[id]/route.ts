import { connectToDatabase } from "@/lib/db/connect";
import { Bank } from "@/models/Bank";
import { PERMISSIONS } from "@/lib/constants/rbac";
import { requireApiUser } from "@/lib/auth/api-guard";
import { apiError, apiSuccess } from "@/lib/utils/api-response";
import { updateBankSchema } from "@/lib/validations/banks";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireApiUser(PERMISSIONS.BANKS_MANAGE);
  if (guard.response) return guard.response;

  const { id } = await params;
  const json = await request.json().catch(() => null);
  const parsed = updateBankSchema.safeParse(json);

  if (!parsed.success) {
    return apiError("اطلاعات ارسالی معتبر نیست", {
      status: 422,
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  await connectToDatabase();
  const bank = await Bank.findById(id);

  if (!bank) {
    return apiError("بانک یافت نشد", { status: 404 });
  }

  if (parsed.data.name && parsed.data.name !== bank.name) {
    const existing = await Bank.findOne({ name: parsed.data.name, _id: { $ne: bank._id } });
    if (existing) {
      return apiError("بانکی با این نام قبلاً ثبت شده است", {
        status: 409,
        errors: { name: ["بانکی با این نام قبلاً ثبت شده است"] },
      });
    }
  }

  Object.assign(bank, parsed.data);
  await bank.save();

  return apiSuccess(
    { id: bank.id, name: bank.name, logoUrl: bank.logoUrl, isActive: bank.isActive },
    { message: "بانک با موفقیت ویرایش شد" },
  );
}
