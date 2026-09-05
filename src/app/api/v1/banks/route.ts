import { connectToDatabase } from "@/lib/db/connect";
import { Bank } from "@/models/Bank";
import { PERMISSIONS } from "@/lib/constants/rbac";
import { requireApiUser } from "@/lib/auth/api-guard";
import { apiError, apiSuccess } from "@/lib/utils/api-response";
import { createBankSchema } from "@/lib/validations/banks";

export async function GET() {
  const guard = await requireApiUser(PERMISSIONS.BANKS_READ);
  if (guard.response) return guard.response;

  await connectToDatabase();
  const banks = await Bank.find().sort({ sortOrder: 1, createdAt: 1 }).lean();

  return apiSuccess(
    banks.map((b) => ({
      id: String(b._id),
      name: b.name,
      logoUrl: b.logoUrl,
      isActive: b.isActive,
      sortOrder: b.sortOrder,
    })),
  );
}

export async function POST(request: Request) {
  const guard = await requireApiUser(PERMISSIONS.BANKS_MANAGE);
  if (guard.response) return guard.response;

  const json = await request.json().catch(() => null);
  const parsed = createBankSchema.safeParse(json);

  if (!parsed.success) {
    return apiError("اطلاعات ارسالی معتبر نیست", {
      status: 422,
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  await connectToDatabase();

  const existing = await Bank.findOne({ name: parsed.data.name });
  if (existing) {
    return apiError("بانکی با این نام قبلاً ثبت شده است", {
      status: 409,
      errors: { name: ["بانکی با این نام قبلاً ثبت شده است"] },
    });
  }

  const bank = await Bank.create({
    name: parsed.data.name,
    logoUrl: parsed.data.logoUrl ?? null,
    logoPublicId: parsed.data.logoPublicId ?? null,
  });

  return apiSuccess(
    { id: bank.id, name: bank.name, logoUrl: bank.logoUrl },
    { message: "بانک با موفقیت ساخته شد", status: 201 },
  );
}
