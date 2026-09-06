import { connectToDatabase } from "@/lib/db/connect";
import { PosTerminal } from "@/models/PosTerminal";
import { Bank } from "@/models/Bank";
import { PERMISSIONS } from "@/lib/constants/rbac";
import { requireApiUser } from "@/lib/auth/api-guard";
import { apiError, apiSuccess } from "@/lib/utils/api-response";
import { updatePosTerminalSchema } from "@/lib/validations/pos-terminals";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireApiUser(PERMISSIONS.PAYMENTS_MANAGE);
  if (guard.response) return guard.response;

  const { id } = await params;
  const json = await request.json().catch(() => null);
  const parsed = updatePosTerminalSchema.safeParse(json);

  if (!parsed.success) {
    return apiError("اطلاعات ارسالی معتبر نیست", {
      status: 422,
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  await connectToDatabase();
  const terminal = await PosTerminal.findById(id);

  if (!terminal) {
    return apiError("کارتخوان یافت نشد", { status: 404 });
  }

  if (parsed.data.bankId) {
    const bank = await Bank.findById(parsed.data.bankId);
    if (!bank || !bank.isActive) {
      return apiError("بانک انتخاب‌شده معتبر نیست", {
        status: 422,
        errors: { bankId: ["بانک انتخاب‌شده معتبر نیست"] },
      });
    }
    terminal.bank = bank._id;
  }

  const { bankId: _bankId, ...rest } = parsed.data;
  void _bankId;
  Object.assign(terminal, rest);
  await terminal.save();

  return apiSuccess(
    {
      id: terminal.id,
      name: terminal.name,
      accountNumber: terminal.accountNumber,
      isActive: terminal.isActive,
    },
    { message: "کارتخوان با موفقیت ویرایش شد" },
  );
}
