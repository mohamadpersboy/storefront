import type { NextRequest } from "next/server";
import type { Types } from "mongoose";
import { connectToDatabase } from "@/lib/db/connect";
import { Check, type ICheck } from "@/models/Check";
import { Bank } from "@/models/Bank";
import { User } from "@/models/User";
import { PERMISSIONS, ROLES } from "@/lib/constants/rbac";
import { requireApiUser } from "@/lib/auth/api-guard";
import { apiError, apiSuccess } from "@/lib/utils/api-response";
import { createCheckSchema, checksListQuerySchema } from "@/lib/validations/checks";
import { logActivity } from "@/lib/audit/log-activity";

type LeanCheck = ICheck & {
  _id: Types.ObjectId;
  bank: { _id: Types.ObjectId; name: string; logoUrl: string | null } | Types.ObjectId;
  receiver:
    | { _id: Types.ObjectId; fullName: string | null; phoneNumber: string }
    | Types.ObjectId;
};

export async function GET(request: NextRequest) {
  const guard = await requireApiUser(PERMISSIONS.CHECKS_READ);
  if (guard.response) return guard.response;

  const { searchParams } = request.nextUrl;
  const parsed = checksListQuerySchema.safeParse({
    page: searchParams.get("page") ?? undefined,
    limit: searchParams.get("limit") ?? undefined,
    search: searchParams.get("search") ?? undefined,
    status: searchParams.get("status") ?? undefined,
    bankId: searchParams.get("bankId") ?? undefined,
  });

  if (!parsed.success) {
    return apiError("پارامترهای جستجو معتبر نیستند", {
      status: 422,
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  const { page, limit, search, status, bankId } = parsed.data;
  await connectToDatabase();

  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;
  if (bankId) filter.bank = bankId;
  if (search) {
    const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.$or = [
      { "issuer.firstName": { $regex: escaped, $options: "i" } },
      { "issuer.lastName": { $regex: escaped, $options: "i" } },
      { "issuer.nationalId": { $regex: escaped, $options: "i" } },
      { phoneNumber: { $regex: escaped, $options: "i" } },
      { checkSeries: { $regex: escaped, $options: "i" } },
      { checkNumber: { $regex: escaped, $options: "i" } },
      { sayadiId: { $regex: escaped, $options: "i" } },
    ];
  }

  const result = await Check.paginate(filter as Record<string, unknown>, {
    page,
    limit,
    sort: { createdAt: -1 },
    lean: true,
    populate: [
      { path: "bank", select: "name logoUrl" },
      { path: "receiver", select: "fullName phoneNumber" },
    ],
  });

  return apiSuccess(
    (result.docs as LeanCheck[]).map((c) => ({
      id: String(c._id),
      bank:
        c.bank && typeof c.bank === "object" && "name" in c.bank
          ? { id: String(c.bank._id), name: c.bank.name, logoUrl: c.bank.logoUrl }
          : null,
      issuer: c.issuer,
      receiver:
        c.receiver && typeof c.receiver === "object" && "fullName" in c.receiver
          ? {
              id: String(c.receiver._id),
              fullName: c.receiver.fullName,
              phoneNumber: c.receiver.phoneNumber,
            }
          : null,
      amount: c.amount,
      receivedDate: c.receivedDate,
      dueDate: c.dueDate,
      sayadiId: c.sayadiId,
      status: c.status,
      transferredTo: c.transferredTo,
      createdAt: c.createdAt,
    })),
    {
      pagination: {
        totalDocs: result.totalDocs,
        totalPages: result.totalPages,
        page: result.page ?? page,
        limit: result.limit,
        hasNextPage: result.hasNextPage,
        hasPrevPage: result.hasPrevPage,
      },
    },
  );
}

export async function POST(request: Request) {
  const guard = await requireApiUser(PERMISSIONS.CHECKS_CREATE);
  if (guard.response) return guard.response;

  const json = await request.json().catch(() => null);
  const parsed = createCheckSchema.safeParse(json);

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

  const receiver = await User.findById(parsed.data.receiverId);
  if (
    !receiver ||
    (receiver.role !== ROLES.ADMIN && receiver.role !== ROLES.SUPER_ADMIN)
  ) {
    return apiError("دریافت‌کننده باید یکی از ادمین‌های سیستم باشد", {
      status: 422,
      errors: { receiverId: ["دریافت‌کننده باید یکی از ادمین‌های سیستم باشد"] },
    });
  }

  const check = await Check.create({
    bank: bank._id,
    issuer: parsed.data.issuer,
    receiver: receiver._id,
    guarantor: parsed.data.guarantor ?? null,
    phoneNumber: parsed.data.phoneNumber,
    receivedDate: parsed.data.receivedDate,
    dueDate: parsed.data.dueDate,
    amount: parsed.data.amount,
    checkSeries: parsed.data.checkSeries,
    checkNumber: parsed.data.checkNumber,
    sayadiId: parsed.data.sayadiId,
    status: parsed.data.status,
    createdBy: guard.user.id,
  });

  await logActivity({
    actor: guard.user,
    action: "check.created",
    targetType: "Check",
    targetId: check.id,
    description: `چک به مبلغ ${parsed.data.amount.toLocaleString("fa-IR")} تومان از طرف ${parsed.data.issuer.firstName} ${parsed.data.issuer.lastName} ثبت شد`,
  });

  return apiSuccess(
    { id: check.id },
    { message: "چک با موفقیت ثبت شد", status: 201 },
  );
}
