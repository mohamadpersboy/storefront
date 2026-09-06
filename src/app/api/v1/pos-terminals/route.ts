import type { Types } from "mongoose";
import { connectToDatabase } from "@/lib/db/connect";
import { PosTerminal, type IPosTerminal } from "@/models/PosTerminal";
import { Bank } from "@/models/Bank";
import { PERMISSIONS } from "@/lib/constants/rbac";
import { requireApiUser } from "@/lib/auth/api-guard";
import { apiError, apiSuccess } from "@/lib/utils/api-response";
import { createPosTerminalSchema } from "@/lib/validations/pos-terminals";

type LeanPosTerminal = IPosTerminal & {
  _id: Types.ObjectId;
  bank: { _id: Types.ObjectId; name: string; logoUrl: string | null } | Types.ObjectId;
};

export async function GET() {
  const guard = await requireApiUser(PERMISSIONS.PAYMENTS_READ);
  if (guard.response) return guard.response;

  await connectToDatabase();
  const terminals = await PosTerminal.find()
    .sort({ sortOrder: 1, createdAt: 1 })
    .populate("bank", "name logoUrl")
    .lean();

  return apiSuccess(
    (terminals as LeanPosTerminal[]).map((t) => ({
      id: String(t._id),
      name: t.name,
      bank:
        t.bank && typeof t.bank === "object" && "name" in t.bank
          ? { id: String(t.bank._id), name: t.bank.name, logoUrl: t.bank.logoUrl }
          : null,
      accountNumber: t.accountNumber,
      isActive: t.isActive,
      sortOrder: t.sortOrder,
    })),
  );
}

export async function POST(request: Request) {
  const guard = await requireApiUser(PERMISSIONS.PAYMENTS_MANAGE);
  if (guard.response) return guard.response;

  const json = await request.json().catch(() => null);
  const parsed = createPosTerminalSchema.safeParse(json);

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

  const terminal = await PosTerminal.create({
    name: parsed.data.name,
    bank: bank._id,
    accountNumber: parsed.data.accountNumber,
  });

  return apiSuccess(
    { id: terminal.id },
    { message: "کارتخوان با موفقیت ساخته شد", status: 201 },
  );
}
