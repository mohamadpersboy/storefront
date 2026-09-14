import { connectToDatabase } from "@/lib/db/connect";
import { requireAuthenticatedUser } from "@/lib/auth/api-guard";
import { apiError, apiSuccess } from "@/lib/utils/api-response";
import { createWithdrawalRequestSchema } from "@/lib/validations/wallet";
import { WithdrawalRequest } from "@/models/WithdrawalRequest";
import { CustomerBankAccount } from "@/models/CustomerBankAccount";
import { adjustWalletBalance, WalletAdjustmentError } from "@/lib/wallet/wallet-service";

/**
 * ثبت درخواست برداشت (بند «درخواست تسویه و واریز به کارت/شبا»).
 * مبلغ همین‌جا (نه لحظه تأیید ادمین) از موجودی کسر می‌شود — با همان
 * `adjustWalletBalance` Atomic — تا کاربر نتواند با چند درخواست
 * هم‌زمان بیشتر از موجودی واقعی‌اش درخواست بدهد. اگر ادمین بعداً رد
 * کند، مبلغ برمی‌گردد (`review` route).
 *
 * **مقصد واریز از کاربر گرفته نمی‌شود.** طبق درخواست صریح کارفرما،
 * تنها مقصد مجاز همان «اطلاعات بانکی» ذخیره‌شده کاربر
 * (`CustomerBankAccount`) است — نه یک Input آزاد در همین فرم. اگر
 * کاربر چنین رکوردی نداشته باشد، پیش از هرگونه کسر از کیف پول با
 * پیام روشن رد می‌شود.
 */
export async function POST(request: Request) {
  const guard = await requireAuthenticatedUser();
  if (guard.response) return guard.response;

  const json = await request.json().catch(() => null);
  const parsed = createWithdrawalRequestSchema.safeParse(json);
  if (!parsed.success) {
    return apiError("اطلاعات ارسالی معتبر نیست", {
      status: 422,
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  await connectToDatabase();

  const bankAccount = await CustomerBankAccount.findOne({ user: guard.user.id }).lean();
  if (!bankAccount) {
    return apiError("ابتدا اطلاعات بانکی خود را ثبت کنید", { status: 422 });
  }

  try {
    await adjustWalletBalance({
      userId: guard.user.id,
      type: "debit",
      amount: parsed.data.amount,
      reason: "درخواست برداشت — در انتظار بررسی و واریز توسط ادمین",
      performedBy: guard.user.id,
    });
  } catch (error) {
    if (error instanceof WalletAdjustmentError) {
      return apiError(error.message, { status: 422 });
    }
    throw error;
  }

  const withdrawal = await WithdrawalRequest.create({
    user: guard.user.id,
    amount: parsed.data.amount,
    destination: {
      ownerName: bankAccount.ownerName,
      cardNumber: bankAccount.cardNumber,
      iban: bankAccount.iban,
    },
    status: "pending",
  });

  return apiSuccess(
    { id: withdrawal.id, amount: withdrawal.amount, status: withdrawal.status },
    { status: 201, message: "درخواست برداشت ثبت شد و در انتظار بررسی است" },
  );
}

export async function GET() {
  const guard = await requireAuthenticatedUser();
  if (guard.response) return guard.response;

  await connectToDatabase();
  const withdrawals = await WithdrawalRequest.find({ user: guard.user.id })
    .sort({ createdAt: -1 })
    .lean();

  return apiSuccess(
    withdrawals.map((w) => ({
      id: String(w._id),
      amount: w.amount,
      destination: w.destination,
      status: w.status,
      reviewNote: w.reviewNote,
      createdAt: w.createdAt,
    })),
  );
}
