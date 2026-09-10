import { connectToDatabase } from "@/lib/db/connect";
import { Banner } from "@/models/Banner";
import { PERMISSIONS } from "@/lib/constants/rbac";
import { requireApiUser } from "@/lib/auth/api-guard";
import { apiError, apiSuccess } from "@/lib/utils/api-response";
import { createBannerSchema } from "@/lib/validations/banners";

/**
 * این Route عمداً بدون `requireApiUser` روی GET است — هم پنل
 * Dashboard (مدیریت بنرها) و هم Storefront (Hero Slider واقعی) از
 * همین یک منبع می‌خوانند، هم‌الگو با `social-links`. نوشتن
 * (POST/PATCH) نیاز به `SETTINGS_MANAGE` دارد.
 */
export async function GET() {
  await connectToDatabase();
  const banners = await Banner.find().sort({ sortOrder: 1, createdAt: 1 }).lean();

  return apiSuccess(
    banners.map((b) => ({
      id: String(b._id),
      title: b.title,
      subtitle: b.subtitle,
      ctaLabel: b.ctaLabel,
      href: b.href,
      imageUrl: b.imageUrl,
      imageBlurDataUrl: b.imageBlurDataUrl,
      isActive: b.isActive,
      sortOrder: b.sortOrder,
    })),
  );
}

export async function POST(request: Request) {
  const guard = await requireApiUser(PERMISSIONS.SETTINGS_MANAGE);
  if (guard.response) return guard.response;

  const json = await request.json().catch(() => null);
  const parsed = createBannerSchema.safeParse(json);

  if (!parsed.success) {
    return apiError("اطلاعات ارسالی معتبر نیست", {
      status: 422,
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  await connectToDatabase();

  const lastBanner = await Banner.findOne().sort({ sortOrder: -1 }).lean();
  const nextSortOrder = (lastBanner?.sortOrder ?? -1) + 1;

  const banner = await Banner.create({
    title: parsed.data.title,
    subtitle: parsed.data.subtitle ?? null,
    ctaLabel: parsed.data.ctaLabel ?? null,
    href: parsed.data.href,
    imageUrl: parsed.data.imageUrl,
    imagePublicId: parsed.data.imagePublicId,
    imageBlurDataUrl: parsed.data.imageBlurDataUrl ?? null,
    sortOrder: nextSortOrder,
  });

  return apiSuccess(
    { id: banner.id, title: banner.title, imageUrl: banner.imageUrl },
    { message: "بنر با موفقیت ساخته شد", status: 201 },
  );
}
