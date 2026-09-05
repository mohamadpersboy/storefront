import { connectToDatabase } from "@/lib/db/connect";
import { Check } from "@/models/Check";
import { PERMISSIONS } from "@/lib/constants/rbac";
import { requireApiUser } from "@/lib/auth/api-guard";
import { apiError, apiSuccess } from "@/lib/utils/api-response";
import { returnCheckSchema } from "@/lib/validations/checks";
import { canReturnCheck, checkStatusLabel } from "@/lib/constants/check-status";
import { logActivity } from "@/lib/audit/log-activity";

/**
 * Returns a received check to its issuer/customer. This is a real
 * financial operation, not a bare status flip (Master Prompt بند ۷،
 * ۹، ۱۱): the Check record is kept intact — nothing is deleted — its
 * status moves to "returned" and `returnInfo` records who it went
 * back to, when, and why, so the audit trail stays complete.
 *
 * NOTE (Phase 1 scope): recomputing an Order's paid/remaining amount
 * when a linked check is returned (Master Prompt بند ۹-۱۰) requires
 * the Check↔Payment↔Order link that Phase 2 introduces. Nothing to
 * recompute yet here because no check can be assigned to an order
 * until then — documented as a Phase 2 dependency, not implemented
 * as a guess in Phase 1.
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

  await logActivity({
    actor: guard.user,
    action: "check.returned",
    targetType: "Check",
    targetId: check.id,
    description: `چک به مبلغ ${check.amount.toLocaleString("fa-IR")} تومان به ${parsed.data.returnedToName} عودت داده شد`,
  });

  return apiSuccess({ id: check.id, status: check.status }, { message: "چک با موفقیت عودت داده شد" });
}
