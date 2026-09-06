import { connectToDatabase } from "@/lib/db/connect";
import { CardAccount } from "@/models/CardAccount";
import { PERMISSIONS } from "@/lib/constants/rbac";
import { requireApiUser } from "@/lib/auth/api-guard";
import { apiError, apiSuccess } from "@/lib/utils/api-response";
import { createCardAccountSchema } from "@/lib/validations/card-accounts";

export async function GET() {
  const guard = await requireApiUser(PERMISSIONS.PAYMENTS_READ);
  if (guard.response) return guard.response;

  await connectToDatabase();
  const accounts = await CardAccount.find().sort({ sortOrder: 1, createdAt: 1 }).lean();

  return apiSuccess(
    accounts.map((a) => ({
      id: String(a._id),
      cardNumber: a.cardNumber,
      accountNumber: a.accountNumber,
      ownerName: a.ownerName,
      isActive: a.isActive,
      sortOrder: a.sortOrder,
    })),
  );
}

export async function POST(request: Request) {
  const guard = await requireApiUser(PERMISSIONS.PAYMENTS_MANAGE);
  if (guard.response) return guard.response;

  const json = await request.json().catch(() => null);
  const parsed = createCardAccountSchema.safeParse(json);

  if (!parsed.success) {
    return apiError("اطلاعات ارسالی معتبر نیست", {
      status: 422,
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  await connectToDatabase();

  const account = await CardAccount.create({
    cardNumber: parsed.data.cardNumber,
    accountNumber: parsed.data.accountNumber,
    ownerName: parsed.data.ownerName,
  });

  return apiSuccess(
    { id: account.id },
    { message: "کارت/حساب با موفقیت ساخته شد", status: 201 },
  );
}
