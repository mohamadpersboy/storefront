"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Pagination } from "@/components/ui/pagination";

/**
 * فقط یک Wrapper نازک روی `Pagination` عمومی موجود پروژه
 * (`src/components/ui/pagination.tsx`) — همان Component را با URL
 * Query هماهنگ می‌کند (بند «Query Parameters»: تغییر صفحه باید
 * سایر فیلترهای فعال را حفظ کند)، بدون ساخت نسخه Duplicate.
 */
export function CategoryPagination({
  basePath,
  page,
  totalPages,
}: {
  basePath: string;
  page: number;
  totalPages: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handlePageChange(nextPage: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (nextPage > 1) params.set("page", String(nextPage));
    else params.delete("page");
    const qs = params.toString();
    router.push(qs ? `${basePath}?${qs}` : basePath, { scroll: false });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return <Pagination page={page} totalPages={totalPages} onPageChange={handlePageChange} />;
}
