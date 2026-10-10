import { connectToDatabase } from "@/lib/db/connect";
import { requireApiUser } from "@/lib/auth/api-guard";
import { PERMISSIONS } from "@/lib/constants/rbac";
import { apiError, apiSuccess } from "@/lib/utils/api-response";
import { reviewWithdrawalRequestSchema } from "@/lib/validations/wallet";
import { reviewWithdrawal } from "@/lib/wallet/review-withdrawal";
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
  const result = await reviewWithdrawal({
    id,
    action: parsed.data.action,
    note: parsed.data.note ?? null,
    actorId: actor._id,
  });
  if (result.kind === "not_found") {
    return apiError("درخواست برداشت یافت نشد", { status: 404 });
  }
  if (result.kind === "conflict") {
    return apiError("این درخواست قبلاً بررسی شده است", { status: 409 });
  }
  if (result.kind === "retry_later") {
    return apiError("استرداد کامل نشد. دوباره رد کنید؛ اثر مالی تکراری ندارد.", { status: 503 });
  }

  await logActivity({
    actor,
    action: parsed.data.action === "approve" ? "withdrawal.approved" : "withdrawal.rejected",
    targetType: "WithdrawalRequest",
    targetId: result.id,
    description:
      parsed.data.action === "approve"
        ? `درخواست برداشت ${result.amount.toLocaleString("fa-IR")} تومانی تأیید و پرداخت‌شده علامت خورد`
        : `درخواست برداشت ${result.amount.toLocaleString("fa-IR")} تومانی رد و مبلغ به کیف پول برگشت داده شد`,
  });

  return apiSuccess(
    { id: result.id, status: result.status },
    { message: parsed.data.action === "approve" ? "درخواست تأیید شد" : "درخواست رد شد" },
  );
}
