import { connectToDatabase } from "@/lib/db/connect";
import { Check } from "@/models/Check";
import { Payment } from "@/models/Payment";
import { PERMISSIONS } from "@/lib/constants/rbac";
import { requireApiUser } from "@/lib/auth/api-guard";
import { apiError, apiSuccess } from "@/lib/utils/api-response";
import { returnCheckSchema } from "@/lib/validations/checks";
import { canReturnCheck, checkStatusLabel } from "@/lib/constants/check-status";
import { logActivity } from "@/lib/audit/log-activity";
import { recalculateOrderPaymentTotals } from "@/lib/payments/recalculate-order-payments";

/**
 * Returns a received check to its issuer/customer. This is a real
 * financial operation, not a bare status flip (Master Prompt بند ۷،
 * ۹، ۱۱): the Check record is kept intact — nothing is deleted — its
 * status moves to "returned" and `returnInfo` records who it went
 * back to, when, and why, so the audit trail stays complete.
 *
 * Phase ۲: if this check is linked to an order through a `Payment`
 * (method "check"), that Payment's status moves to "returned" too —
 * it is never deleted, only stops counting as received money — and
 * the order's `paidAmount`/`remainingAmount` are recomputed (بند
 * ۹-۱۱). A check registered but never assigned to any order simply
 * has no matching Payment, so this is a no-op for it.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireApiUser(PERMISSIONS.CHECKS_RETURN);
  if (guard.response) return guard.response;

  const { id } = await params;
  const json = await request.json().catch(() => null);
  const parsed = returnCheckSchema.safeParse(json);

  if (!parsed.success) {
    return apiError("اطلاعات ارسالی معتبر نیست", {
      status: 422,
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  await connectToDatabase();
  const check = await Check.findById(id);

  if (!check) {
    return apiError("چک یافت نشد", { status: 404 });
  }

  if (!canReturnCheck(check.status)) {
    return apiError(
      `چکی با وضعیت «${checkStatusLabel(check.status)}» قابل عودت نیست`,
      { status: 409 },
    );
  }

  check.status = "returned";
  check.returnInfo = {
    returnedAt: parsed.data.returnedAt,
    returnedToName: parsed.data.returnedToName,
    returnedToNationalId: parsed.data.returnedToNationalId ?? null,
    reason: parsed.data.reason,
  };

  await check.save();

  const linkedPayment = await Payment.findOne({ check: check._id, status: { $ne: "returned" } });
  if (linkedPayment) {
    linkedPayment.status = "returned";
    await linkedPayment.save();
    await recalculateOrderPaymentTotals(String(linkedPayment.order));
  }

  await logActivity({
    actor: guard.user,
    action: "check.returned",
    targetType: "Check",
    targetId: check.id,
    description: `چک به مبلغ ${check.amount.toLocaleString("fa-IR")} تومان به ${parsed.data.returnedToName} عودت داده شد`,
  });

  return apiSuccess(
    { id: check.id, status: check.status, orderAffected: Boolean(linkedPayment) },
    { message: "چک با موفقیت عودت داده شد" },
  );
}
