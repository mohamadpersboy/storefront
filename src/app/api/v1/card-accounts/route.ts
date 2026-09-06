import type { Types } from "mongoose";
import { connectToDatabase } from "@/lib/db/connect";
import { CardAccount, type ICardAccount } from "@/models/CardAccount";
import { Bank } from "@/models/Bank";
import { PERMISSIONS } from "@/lib/constants/rbac";
import { requireApiUser } from "@/lib/auth/api-guard";
import { apiError, apiSuccess } from "@/lib/utils/api-response";
import { createCardAccountSchema } from "@/lib/validations/card-accounts";

type LeanCardAccount = ICardAccount & {
  _id: Types.ObjectId;
  bank: { _id: Types.ObjectId; name: string; logoUrl: string | null } | Types.ObjectId | null;
};

export async function GET() {
  const guard = await requireApiUser(PERMISSIONS.PAYMENTS_READ);
  if (guard.response) return guard.response;

  await connectToDatabase();
  const accounts = await CardAccount.find()
    .sort({ sortOrder: 1, createdAt: 1 })
    .populate("bank", "name logoUrl")
    .lean();

  return apiSuccess(
    (accounts as LeanCardAccount[]).map((a) => ({
      id: String(a._id),
      cardNumber: a.cardNumber,
      shabaNumber: a.shabaNumber,
      bank:
        a.bank && typeof a.bank === "object" && "name" in a.bank
          ? { id: String(a.bank._id), name: a.bank.name, logoUrl: a.bank.logoUrl }
          : null,
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

  const bank = await Bank.findById(parsed.data.bankId);
  if (!bank || !bank.isActive) {
    return apiError("بانک انتخاب‌شده معتبر نیست", {
      status: 422,
      errors: { bankId: ["بانک انتخاب‌شده معتبر نیست"] },
    });
  }

  const account = await CardAccount.create({
    cardNumber: parsed.data.cardNumber,
    shabaNumber: parsed.data.shabaNumber,
    bank: bank._id,
    accountNumber: parsed.data.accountNumber,
    ownerName: parsed.data.ownerName,
  });

  return apiSuccess(
    { id: account.id },
    { message: "کارت/حساب با موفقیت ساخته شد", status: 201 },
  );
}
