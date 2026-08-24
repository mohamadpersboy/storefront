import { connectToDatabase } from "@/lib/db/connect";
import { User } from "@/models/User";
import { ROLES } from "@/lib/constants/rbac";
import { PERMISSIONS } from "@/lib/constants/rbac";
import { requireApiUser } from "@/lib/auth/api-guard";
import { apiError, apiSuccess } from "@/lib/utils/api-response";
import { findOrCreateCustomerSchema } from "@/lib/validations/orders";

export async function POST(request: Request) {
  const guard = await requireApiUser(PERMISSIONS.ORDERS_UPDATE);
  if (guard.response) return guard.response;

  const json = await request.json().catch(() => null);
  const parsed = findOrCreateCustomerSchema.safeParse(json);

  if (!parsed.success) {
    return apiError("اطلاعات ارسالی معتبر نیست", {
      status: 422,
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  const { phoneNumber, fullName } = parsed.data;
  await connectToDatabase();

  let user = await User.findOne({ phoneNumber });

  if (!user) {
    user = await User.create({
      phoneNumber,
      fullName,
      role: ROLES.CUSTOMER,
    });
  } else if (fullName && !user.fullName) {
    // Fill in a missing name opportunistically, never overwrite one
    // the customer already set themselves.
    user.fullName = fullName;
    await user.save();
  }

  return apiSuccess({
    id: user.id,
    phoneNumber: user.phoneNumber,
    fullName: user.fullName ?? null,
    role: user.role,
  });
}
