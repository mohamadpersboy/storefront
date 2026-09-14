import { connectToDatabase } from "@/lib/db/connect";
import { requireAuthenticatedUser } from "@/lib/auth/api-guard";
import { apiError, apiSuccess } from "@/lib/utils/api-response";
import { updateProfileSchema } from "@/lib/validations/account";
import { User } from "@/models/User";

/**
 * ویرایش نام و نام‌خانوادگی — برخلاف شماره موبایل، نیازی به OTP
 * ندارد چون شناسه ورود/امنیتی حساب نیست، فقط یک برچسب نمایشی است.
 */
export async function PATCH(request: Request) {
  const guard = await requireAuthenticatedUser();
  if (guard.response) return guard.response;

  const json = await request.json().catch(() => null);
  const parsed = updateProfileSchema.safeParse(json);
  if (!parsed.success) {
    return apiError("اطلاعات ارسالی معتبر نیست", {
      status: 422,
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  await connectToDatabase();

  const user = await User.findById(guard.user.id);
  if (!user) {
    return apiError("کاربر یافت نشد", { status: 404 });
  }

  user.fullName = parsed.data.fullName;
  await user.save();

  return apiSuccess({ fullName: user.fullName }, { message: "نام با موفقیت ذخیره شد" });
}
