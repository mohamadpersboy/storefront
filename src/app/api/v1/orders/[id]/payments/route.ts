import { randomUUID } from "crypto";
import type { Types } from "mongoose";
import { connectToDatabase } from "@/lib/db/connect";
import { Order } from "@/models/Order";
import { Payment, type PaymentDocument } from "@/models/Payment";
import { Check, type ICheck } from "@/models/Check";
import { Bank } from "@/models/Bank";
import { PosTerminal } from "@/models/PosTerminal";
import { CardAccount } from "@/models/CardAccount";
import { User } from "@/models/User";
import { PERMISSIONS, ROLES } from "@/lib/constants/rbac";
import { requireApiUser } from "@/lib/auth/api-guard";
import { apiError, apiSuccess } from "@/lib/utils/api-response";
import { recordOrderPaymentSchema } from "@/lib/validations/order-payments";
import { canAssignCheckToOrder, checkStatusLabel } from "@/lib/constants/check-status";
import { recalculateOrderPaymentTotals } from "@/lib/payments/recalculate-order-payments";
import { logActivity } from "@/lib/audit/log-activity";

type LeanPayment = {
  _id: Types.ObjectId;
  amount: number;
  walletAmount: number;
  method: string;
  status: string;
  createdAt: Date;
  paidAt: Date | null;
  posTerminal: { _id: Types.ObjectId; name: string } | Types.ObjectId | null;
  cardAccount:
    | { _id: Types.ObjectId; cardNumber: string; ownerName: string }
    | Types.ObjectId
    | null;
  check:
    | (ICheck & {
        _id: Types.ObjectId;
        bank: { _id: Types.ObjectId; name: string } | Types.ObjectId;
      })
    | Types.ObjectId
    | null;
};

function populatedName(
  ref: { name: string } | Types.ObjectId | null,
): string | null {
  return ref && typeof ref === "object" && "name" in ref ? ref.name : null;
}

/** GET /api/v1/orders/:id/payments — every payment (online + manual) recorded against this order. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireApiUser(PERMISSIONS.PAYMENTS_READ);
  if (guard.response) return guard.response;

  const { id } = await params;
  await connectToDatabase();

  const payments = await Payment.find({ order: id })
    .sort({ createdAt: -1 })
    .populate("posTerminal", "name")
    .populate("cardAccount", "cardNumber ownerName")
    .populate({ path: "check", populate: { path: "bank", select: "name" } })
    .lean();

  return apiSuccess(
    (payments as unknown as LeanPayment[]).map((p) => ({
      id: String(p._id),
      amount: p.amount,
      walletAmount: p.walletAmount,
      method: p.method,
      status: p.status,
      createdAt: p.createdAt,
      paidAt: p.paidAt,
      posTerminal: populatedName(p.posTerminal),
      cardAccount:
        p.cardAccount && typeof p.cardAccount === "object" && "ownerName" in p.cardAccount
          ? { ownerName: p.cardAccount.ownerName, cardNumber: p.cardAccount.cardNumber }
          : null,
      check:
        p.check && typeof p.check === "object" && "amount" in p.check
          ? {
              id: String(p.check._id),
              amount: p.check.amount,
              dueDate: p.check.dueDate,
              sayadiId: p.check.sayadiId,
              status: p.check.status,
              bank: populatedName(p.check.bank as { name: string } | Types.ObjectId | null),
            }
          : null,
    })),
  );
}

/** POST /api/v1/orders/:id/payments — record how an admin actually received money for this order. */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireApiUser(PERMISSIONS.PAYMENTS_MANAGE);
  if (guard.response) return guard.response;

  const { id: orderId } = await params;
  const json = await request.json().catch(() => null);
  const parsed = recordOrderPaymentSchema.safeParse(json);

  if (!parsed.success) {
    return apiError("اطلاعات ارسالی معتبر نیست", {
      status: 422,
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  await connectToDatabase();

  const order = await Order.findById(orderId);
  if (!order) {
    return apiError("سفارش یافت نشد", { status: 404 });
  }

  const data = parsed.data;
  let amount: number;
  let checkId: Types.ObjectId | null = null;
  let posTerminalId: Types.ObjectId | null = null;
  let cardAccountId: Types.ObjectId | null = null;
  let description: string;

  if (data.method === "cash") {
    amount = data.amount;
    description = `دریافت نقدی برای سفارش #${order.orderNumber}`;
  } else if (data.method === "pos") {
    const terminal = await PosTerminal.findById(data.posTerminalId);
    if (!terminal || !terminal.isActive) {
      return apiError("کارتخوان انتخاب‌شده معتبر نیست", {
        status: 422,
        errors: { posTerminalId: ["کارتخوان انتخاب‌شده معتبر نیست"] },
      });
    }
    amount = data.amount;
    posTerminalId = terminal._id;
    description = `دریافت کارتخوانی (${terminal.name}) برای سفارش #${order.orderNumber}`;
  } else if (data.method === "card_transfer") {
    const account = await CardAccount.findById(data.cardAccountId);
    if (!account || !account.isActive) {
      return apiError("کارت/حساب انتخاب‌شده معتبر نیست", {
        status: 422,
        errors: { cardAccountId: ["کارت/حساب انتخاب‌شده معتبر نیست"] },
      });
    }
    amount = data.amount;
    cardAccountId = account._id;
    description = `کارت به کارت (${account.ownerName}) برای سفارش #${order.orderNumber}`;
  } else {
    // method === "check"
    let check;

    if (data.checkId) {
      check = await Check.findById(data.checkId);
      if (!check) {
        return apiError("چک یافت نشد", { status: 404 });
      }
      if (!canAssignCheckToOrder(check.status)) {
        return apiError(
          `چکی با وضعیت «${checkStatusLabel(check.status)}» قابل تخصیص به سفارش نیست`,
          { status: 409 },
        );
      }
      const alreadyAssigned = await Payment.findOne({
        check: check._id,
        status: { $ne: "returned" },
      });
      if (alreadyAssigned) {
        return apiError("این چک قبلاً به یک سفارش دیگر تخصیص داده شده است", {
          status: 409,
        });
      }
    } else if (data.newCheck) {
      const bank = await Bank.findById(data.newCheck.bankId);
      if (!bank || !bank.isActive) {
        return apiError("بانک انتخاب‌شده معتبر نیست", {
          status: 422,
          errors: { bankId: ["بانک انتخاب‌شده معتبر نیست"] },
        });
      }
      const receiver = await User.findById(data.newCheck.receiverId);
      if (
        !receiver ||
        (receiver.role !== ROLES.ADMIN && receiver.role !== ROLES.SUPER_ADMIN)
      ) {
        return apiError("دریافت‌کننده باید یکی از ادمین‌های سیستم باشد", {
          status: 422,
          errors: { receiverId: ["دریافت‌کننده باید یکی از ادمین‌های سیستم باشد"] },
        });
      }
      check = await Check.create({
        bank: bank._id,
        issuer: data.newCheck.issuer,
        receiver: receiver._id,
        guarantor: data.newCheck.guarantor ?? null,
        phoneNumber: data.newCheck.phoneNumber,
        receivedDate: data.newCheck.receivedDate,
        dueDate: data.newCheck.dueDate,
        amount: data.newCheck.amount,
        checkSeries: data.newCheck.checkSeries,
        checkNumber: data.newCheck.checkNumber,
        sayadiId: data.newCheck.sayadiId,
        status: data.newCheck.status,
        createdBy: guard.user.id,
      });
      await logActivity({
        actor: guard.user,
        action: "check.created",
        targetType: "Check",
        targetId: check.id,
        description: `چک به مبلغ ${data.newCheck.amount.toLocaleString("fa-IR")} تومان از طرف ${data.newCheck.issuer.firstName} ${data.newCheck.issuer.lastName} ثبت شد`,
      });
    } else {
      return apiError("اطلاعات چک ناقص است", { status: 422 });
    }

    amount = check.amount;
    checkId = check._id;
    description = `دریافت چک (شناسه صیادی ${check.sayadiId}) برای سفارش #${order.orderNumber}`;
  }

  const payment: PaymentDocument = await Payment.create({
    order: order._id,
    amount,
    provider: "manual",
    method: data.method,
    status: "paid",
    authority: `manual-${randomUUID()}`,
    description,
    initiatedBy: guard.user.id,
    posTerminal: posTerminalId,
    cardAccount: cardAccountId,
    check: checkId,
    paidAt: new Date(),
  });

  await recalculateOrderPaymentTotals(order.id);

  await logActivity({
    actor: guard.user,
    action: "order.payment_recorded",
    targetType: "Order",
    targetId: order.id,
    description: `${description} — مبلغ ${amount.toLocaleString("fa-IR")} تومان`,
  });

  return apiSuccess(
    { id: payment.id, amount, method: data.method },
    { message: "پرداخت با موفقیت ثبت شد", status: 201 },
  );
}
