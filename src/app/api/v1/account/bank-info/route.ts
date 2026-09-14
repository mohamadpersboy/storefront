import { connectToDatabase } from "@/lib/db/connect";
import { requireAuthenticatedUser } from "@/lib/auth/api-guard";
import { apiError, apiSuccess } from "@/lib/utils/api-response";
import { saveBankInfoSchema } from "@/lib/validations/bank-info";
import { CustomerBankAccount } from "@/models/CustomerBankAccount";

/**
 * اطلاعات بانکی خود کاربر — یک رکورد در ازای هر کاربر (توضیح کامل
 * دلیل جدا بودن از `WithdrawalRequest.destination` در
 * `models/CustomerBankAccount.ts`).
 */
export async function GET() {
  const guard = await requireAuthenticatedUser();
  if (guard.response) return guard.response;

  await connectToDatabase();

  const bankAccount = await CustomerBankAccount.findOne({ user: guard.user.id }).lean();

  return apiSuccess(
    bankAccount
      ? {
          ownerName: bankAccount.ownerName,
          bankName: bankAccount.bankName,
          cardNumber: bankAccount.cardNumber,
          iban: bankAccount.iban,
        }
      : null,
  );
}

export async function PUT(request: Request) {
  const guard = await requireAuthenticatedUser();
  if (guard.response) return guard.response;

  const json = await request.json().catch(() => null);
  const parsed = saveBankInfoSchema.safeParse(json);
  if (!parsed.success) {
    return apiError("اطلاعات ارسالی معتبر نیست", {
      status: 422,
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  await connectToDatabase();

  const bankAccount = await CustomerBankAccount.findOneAndUpdate(
    { user: guard.user.id },
    {
      $set: {
        ownerName: parsed.data.ownerName,
        bankName: parsed.data.bankName || null,
        cardNumber: parsed.data.cardNumber || null,
        iban: parsed.data.iban || null,
      },
    },
    { upsert: true, new: true },
  );

  return apiSuccess(
    {
      ownerName: bankAccount.ownerName,
      bankName: bankAccount.bankName,
      cardNumber: bankAccount.cardNumber,
      iban: bankAccount.iban,
    },
    { message: "اطلاعات بانکی ذخیره شد" },
  );
}

export async function DELETE() {
  const guard = await requireAuthenticatedUser();
  if (guard.response) return guard.response;

  await connectToDatabase();
  await CustomerBankAccount.deleteOne({ user: guard.user.id });

  return apiSuccess({ deleted: true }, { message: "اطلاعات بانکی حذف شد" });
}
