import { connectToDatabase } from "@/lib/db/connect";
import { Color } from "@/models/Color";
import { PERMISSIONS } from "@/lib/constants/rbac";
import { requireApiUser } from "@/lib/auth/api-guard";
import { apiError, apiSuccess } from "@/lib/utils/api-response";
import { createColorSchema } from "@/lib/validations/colors";

export async function GET() {
  const guard = await requireApiUser(PERMISSIONS.COLORS_READ);
  if (guard.response) return guard.response;

  await connectToDatabase();
  const colors = await Color.find().sort({ sortOrder: 1, createdAt: 1 }).lean();

  return apiSuccess(
    colors.map((c) => ({
      id: String(c._id),
      name: c.name,
      hexCode: c.hexCode,
      isActive: c.isActive,
      sortOrder: c.sortOrder,
    })),
  );
}

export async function POST(request: Request) {
  const guard = await requireApiUser(PERMISSIONS.COLORS_MANAGE);
  if (guard.response) return guard.response;

  const json = await request.json().catch(() => null);
  const parsed = createColorSchema.safeParse(json);

  if (!parsed.success) {
    return apiError("اطلاعات ارسالی معتبر نیست", {
      status: 422,
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  await connectToDatabase();

  const existing = await Color.findOne({ name: parsed.data.name });
  if (existing) {
    return apiError("رنگی با این نام قبلاً ثبت شده است", {
      status: 409,
      errors: { name: ["رنگی با این نام قبلاً ثبت شده است"] },
    });
  }

  const color = await Color.create(parsed.data);

  return apiSuccess(
    { id: color.id, name: color.name, hexCode: color.hexCode },
    { message: "رنگ با موفقیت ساخته شد", status: 201 },
  );
}
