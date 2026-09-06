import { connectToDatabase } from "@/lib/db/connect";
import { CardAccount, type ICardAccount } from "@/models/CardAccount";
import { PERMISSIONS } from "@/lib/constants/rbac";
import { requireApiUser } from "@/lib/auth/api-guard";
import { apiError, apiSuccess } from "@/lib/utils/api-response";
import { sendCardAccountSchema } from "@/lib/validations/card-accounts";
import { sendCardShareSms } from "@/lib/sms/send-card-share-sms";
import { logActivity } from "@/lib/audit/log-activity";

/**
 * POST /api/v1/card-accounts/:id/send
 *
 * Texts this card/account's number, shaba, bank name, and owner name
 * (plus the store's name) to a customer's phone number. The wording
 * itself lives in `src/lib/sms/card-share-message.ts` — the only file
 * to touch when the message text needs to change later.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireApiUser(PERMISSIONS.PAYMENTS_MANAGE);
  if (guard.response) return guard.response;

  const { id } = await params;
  const json = await request.json().catch(() => null);
  const parsed = sendCardAccountSchema.safeParse(json);

  if (!parsed.success) {
    return apiError("اطلاعات ارسالی معتبر نیست", {
      status: 422,
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  await connectToDatabase();

  const account = (await CardAccount.findById(id)
    .populate("bank", "name")
    .lean()) as (ICardAccount & { bank: { name: string } | null }) | null;

  if (!account) {
    return apiError("کارت/حساب یافت نشد", { status: 404 });
  }

  if (!account.bank || !account.shabaNumber) {
    return apiError(
      "این کارت/حساب هنوز بانک یا شماره شبا ندارد؛ ابتدا آن را ویرایش و تکمیل کنید",
      { status: 422 },
    );
  }

  try {
    await sendCardShareSms(parsed.data.phoneNumber, {
      cardNumber: account.cardNumber,
      shabaNumber: account.shabaNumber,
      bankName: account.bank.name,
      ownerName: account.ownerName,
    });
  } catch (error) {
    console.error("Failed to send card-share SMS:", error);
    return apiError("ارسال پیامک با خطا مواجه شد، دوباره تلاش کنید", { status: 502 });
  }

  await logActivity({
    actor: guard.user,
    action: "card_account.shared",
    targetType: "CardAccount",
    targetId: id,
    description: `اطلاعات کارت به شماره ${parsed.data.phoneNumber} پیامک شد`,
  });

  return apiSuccess({ id }, { message: "اطلاعات کارت برای مشتری ارسال شد" });
}
