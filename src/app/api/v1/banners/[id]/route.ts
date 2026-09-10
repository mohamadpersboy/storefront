import { connectToDatabase } from "@/lib/db/connect";
import { Banner } from "@/models/Banner";
import { PERMISSIONS } from "@/lib/constants/rbac";
import { requireApiUser } from "@/lib/auth/api-guard";
import { apiError, apiSuccess } from "@/lib/utils/api-response";
import { updateBannerSchema } from "@/lib/validations/banners";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireApiUser(PERMISSIONS.SETTINGS_MANAGE);
  if (guard.response) return guard.response;

  const { id } = await params;
  const json = await request.json().catch(() => null);
  const parsed = updateBannerSchema.safeParse(json);

  if (!parsed.success) {
    return apiError("اطلاعات ارسالی معتبر نیست", {
      status: 422,
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  await connectToDatabase();
  const banner = await Banner.findById(id);

  if (!banner) {
    return apiError("بنر یافت نشد", { status: 404 });
  }

  Object.assign(banner, parsed.data);
  await banner.save();

  return apiSuccess(
    {
      id: banner.id,
      title: banner.title,
      imageUrl: banner.imageUrl,
      isActive: banner.isActive,
    },
    { message: "بنر با موفقیت ویرایش شد" },
  );
}
