import { connectToDatabase } from "@/lib/db/connect";
import { Check } from "@/models/Check";
import { Bank } from "@/models/Bank";
import { User } from "@/models/User";
import { Payment } from "@/models/Payment";
import { PERMISSIONS, ROLES } from "@/lib/constants/rbac";
import { requireApiUser } from "@/lib/auth/api-guard";
import { apiError, apiSuccess } from "@/lib/utils/api-response";
import { updateCheckSchema } from "@/lib/validations/checks";
import { logActivity } from "@/lib/audit/log-activity";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireApiUser(PERMISSIONS.CHECKS_READ);
  if (guard.response) return guard.response;

  const { id } = await params;
  await connectToDatabase();

  const check = await Check.findById(id)
    .populate("bank", "name logoUrl")
    .populate("receiver", "fullName phoneNumber")
    .populate("createdBy", "fullName phoneNumber")
    .lean();

  if (!check) {
    return apiError("چک یافت نشد", { status: 404 });
  }

  // Phase ۲: چک متصل به سفارش، از طریق Payment (بند ۱۴)
  const linkedPayment = await Payment.findOne({ check: check._id })
    .populate("order", "orderNumber")
    .lean();

  return apiSuccess({
    id: String(check._id),
    linkedOrder:
      linkedPayment && linkedPayment.order
        ? {
            orderId: String((linkedPayment.order as { _id: unknown })._id),
            orderNumber: (linkedPayment.order as unknown as { orderNumber: number }).orderNumber,
            paymentStatus: linkedPayment.status,
          }
        : null,
    bank: check.bank,
    issuer: check.issuer,
    receiver: check.receiver,
    guarantor: check.guarantor,
    phoneNumber: check.phoneNumber,
    receivedDate: check.receivedDate,
    dueDate: check.dueDate,
    amount: check.amount,
    checkSeries: check.checkSeries,
    checkNumber: check.checkNumber,
    sayadiId: check.sayadiId,
    status: check.status,
    transferredTo: check.transferredTo,
    returnInfo: check.returnInfo,
    createdBy: check.createdBy,
    createdAt: check.createdAt,
  });
}

/**
 * Only allowed while the check is still "registered"/"not_registered" —
 * once returned/transferred, the record is locked to preserve the
 * financial audit trail (Master Prompt بند ۱۱، ۱۵).
 */
const EDITABLE_STATUSES = new Set(["registered", "not_registered"]);

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireApiUser(PERMISSIONS.CHECKS_UPDATE);
  if (guard.response) return guard.response;

  const { id } = await params;
  const json = await request.json().catch(() => null);
  const parsed = updateCheckSchema.safeParse(json);

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

  if (!EDITABLE_STATUSES.has(check.status)) {
    return apiError("این چک عودت‌شده/انتقال‌یافته است و قابل ویرایش نیست", { status: 409 });
  }

  if (parsed.data.bankId) {
    const bank = await Bank.findById(parsed.data.bankId);
    if (!bank || !bank.isActive) {
      return apiError("بانک انتخاب‌شده معتبر نیست", {
        status: 422,
        errors: { bankId: ["بانک انتخاب‌شده معتبر نیست"] },
      });
    }
    check.bank = bank._id;
  }

  if (parsed.data.receiverId) {
    const receiver = await User.findById(parsed.data.receiverId);
    if (!receiver || (receiver.role !== ROLES.ADMIN && receiver.role !== ROLES.SUPER_ADMIN)) {
      return apiError("دریافت‌کننده باید یکی از ادمین‌های سیستم باشد", {
        status: 422,
        errors: { receiverId: ["دریافت‌کننده باید یکی از ادمین‌های سیستم باشد"] },
      });
    }
    check.receiver = receiver._id;
  }

  if (parsed.data.issuer) check.issuer = parsed.data.issuer;
  if (parsed.data.guarantor !== undefined) check.guarantor = parsed.data.guarantor;
  if (parsed.data.phoneNumber) check.phoneNumber = parsed.data.phoneNumber;
  if (parsed.data.receivedDate) check.receivedDate = parsed.data.receivedDate;
  if (parsed.data.dueDate) check.dueDate = parsed.data.dueDate;
  if (parsed.data.amount) check.amount = parsed.data.amount;
  if (parsed.data.checkSeries) check.checkSeries = parsed.data.checkSeries;
  if (parsed.data.checkNumber) check.checkNumber = parsed.data.checkNumber;
  if (parsed.data.sayadiId) check.sayadiId = parsed.data.sayadiId;

  if (check.dueDate < check.receivedDate) {
    return apiError("تاریخ سررسید نمی‌تواند قبل از تاریخ دریافت باشد", {
      status: 422,
      errors: { dueDate: ["تاریخ سررسید نمی‌تواند قبل از تاریخ دریافت باشد"] },
    });
  }

  await check.save();

  await logActivity({
    actor: guard.user,
    action: "check.updated",
    targetType: "Check",
    targetId: check.id,
    description: "اطلاعات چک ویرایش شد",
  });

  return apiSuccess({ id: check.id }, { message: "چک با موفقیت ویرایش شد" });
}
