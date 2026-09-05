import { connectToDatabase } from "@/lib/db/connect";
import { Check } from "@/models/Check";
import { PERMISSIONS } from "@/lib/constants/rbac";
import { requireApiUser } from "@/lib/auth/api-guard";
import { apiError, apiSuccess } from "@/lib/utils/api-response";
import { transferCheckSchema } from "@/lib/validations/checks";
import { canTransferCheck, checkStatusLabel } from "@/lib/constants/check-status";
import { logActivity } from "@/lib/audit/log-activity";

/**
 * Records the transfer of a received check to a third party (Master
 * Prompt بند ۶). Only the current transfer target is stored on the
 * Check itself; a fuller transfer history/ledger is explicitly
 * deferred to a future phase (بند ۶: "معماری باید قابلیت توسعه ...
 * تاریخچه انتقال ... را داشته باشد"), so this deliberately doesn't
 * invent an array-based history now.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireApiUser(PERMISSIONS.CHECKS_TRANSFER);
  if (guard.response) return guard.response;

  const { id } = await params;
  const json = await request.json().catch(() => null);
  const parsed = transferCheckSchema.safeParse(json);

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

  if (!canTransferCheck(check.status)) {
    return apiError(
      `چکی با وضعیت «${checkStatusLabel(check.status)}» قابل انتقال نیست`,
      { status: 409 },
    );
  }

  check.status = "transferred";
  check.transferredTo = {
    firstName: parsed.data.firstName,
    lastName: parsed.data.lastName,
    nationalId: parsed.data.nationalId ?? undefined,
  };

  await check.save();

  await logActivity({
    actor: guard.user,
    action: "check.transferred",
    targetType: "Check",
    targetId: check.id,
    description: `چک به مبلغ ${check.amount.toLocaleString("fa-IR")} تومان به ${parsed.data.firstName} ${parsed.data.lastName} منتقل شد`,
  });

  return apiSuccess(
    { id: check.id, status: check.status },
    { message: "انتقال چک با موفقیت ثبت شد" },
  );
}
