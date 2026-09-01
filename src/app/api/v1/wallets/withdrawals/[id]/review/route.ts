import { connectToDatabase } from "@/lib/db/connect";
import { requireApiUser } from "@/lib/auth/api-guard";
import { PERMISSIONS } from "@/lib/constants/rbac";
import { apiError, apiSuccess } from "@/lib/utils/api-response";
import { reviewWithdrawalRequestSchema } from "@/lib/validations/wallet";
import { WithdrawalRequest } from "@/models/WithdrawalRequest";
import { adjustWalletBalance } from "@/lib/wallet/wallet-service";
import { logActivity } from "@/lib/audit/log-activity";

/**
 * تأیید = ادمین واریز واقعی به کارت/شبا را *خارج از این سیستم* انجام
 * داده (کارت‌به‌کارت یا پایا/ساتنا) و فقط وضعیت را ثبت می‌کند — هیچ
 * تغییر موجودی این‌جا رخ نمی‌دهد چون مبلغ از لحظه ثبت درخواست کسر
 * شده بود.
 *
 * رد = مبلغ به موجودی کاربر برمی‌گردد (Atomic، همان تابع مشترک).
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireApiUser(PERMISSIONS.WALLET_MANAGE);
  if (guard.response) return guard.response;
  const { user: actor } = guard;

  const { id } = await params;

  const json = await request.json().catch(() => null);
  const parsed = reviewWithdrawalRequestSchema.safeParse(json);
  if (!parsed.success) {
    return apiError("اطلاعات ارسالی معتبر نیست", {
      status: 422,
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  await connectToDatabase();
  const withdrawal = await WithdrawalRequest.findById(id);
  if (!withdrawal) {
    return apiError("درخواست برداشت یافت نشد", { status: 404 });
  }
  if (withdrawal.status !== "pending") {
    return apiError("این درخواست قبلاً بررسی شده است", { status: 409 });
  }

  if (parsed.data.action === "reject") {
    await adjustWalletBalance({
      userId: String(withdrawal.user),
      type: "credit",
      amount: withdrawal.amount,
      reason: `استرداد درخواست برداشت رد‌شده${parsed.data.note ? ` — ${parsed.data.note}` : ""}`,
      performedBy: actor.id,
    });
    withdrawal.status = "rejected";
  } else {
    withdrawal.status = "approved_paid";
  }

  withdrawal.reviewedBy = actor._id;
  withdrawal.reviewNote = parsed.data.note ?? null;
  withdrawal.reviewedAt = new Date();
  await withdrawal.save();

  await logActivity({
    actor,
    action: parsed.data.action === "approve" ? "withdrawal.approved" : "withdrawal.rejected",
    targetType: "WithdrawalRequest",
    targetId: String(withdrawal._id),
    description:
      parsed.data.action === "approve"
        ? `درخواست برداشت ${withdrawal.amount.toLocaleString("fa-IR")} تومانی تأیید و پرداخت‌شده علامت خورد`
        : `درخواست برداشت ${withdrawal.amount.toLocaleString("fa-IR")} تومانی رد و مبلغ به کیف پول برگشت داده شد`,
  });

  return apiSuccess(
    { id: withdrawal.id, status: withdrawal.status },
    { message: parsed.data.action === "approve" ? "درخواست تأیید شد" : "درخواست رد شد" },
  );
}
