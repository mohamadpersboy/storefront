import { ReviewsPageClient } from "@/components/reviews/reviews-page-client";
import { getCurrentUser } from "@/lib/auth/current-user";
import { PERMISSIONS, roleHasPermission } from "@/lib/constants/rbac";

export default async function ReviewsPage() {
  const user = await getCurrentUser();
  const canManage = user ? roleHasPermission(user.role, PERMISSIONS.REVIEWS_MANAGE) : false;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-semibold text-foreground">نظرات</h1>
        <p className="mt-1 text-sm text-muted">
          نظرات کاربران درباره محصولات. فقط نظرات تأییدشده در فروشگاه نمایش داده می‌شوند.
        </p>
      </div>
      <ReviewsPageClient canManage={canManage} />
    </div>
  );
}
