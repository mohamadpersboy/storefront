import { connectToDatabase } from "@/lib/db/connect";
import { CardAccount } from "@/models/CardAccount";
import { PERMISSIONS } from "@/lib/constants/rbac";
import { requireApiUser } from "@/lib/auth/api-guard";
import { apiError, apiSuccess } from "@/lib/utils/api-response";
import { updateCardAccountSchema } from "@/lib/validations/card-accounts";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireApiUser(PERMISSIONS.PAYMENTS_MANAGE);
  if (guard.response) return guard.response;

  const { id } = await params;
  const json = await request.json().catch(() => null);
  const parsed = updateCardAccountSchema.safeParse(json);

  if (!parsed.success) {
    return apiError("اطلاعات ارسالی معتبر نیست", {
      status: 422,
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  await connectToDatabase();
  const account = await CardAccount.findById(id);

  if (!account) {
    return apiError("کارت/حساب یافت نشد", { status: 404 });
  }

  Object.assign(account, parsed.data);
  await account.save();

  return apiSuccess(
    {
      id: account.id,
      cardNumber: account.cardNumber,
      accountNumber: account.accountNumber,
      ownerName: account.ownerName,
      isActive: account.isActive,
    },
    { message: "کارت/حساب با موفقیت ویرایش شد" },
  );
}
