import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { CheckDetailCard } from "@/components/checks/check-detail-card";

export default async function CheckDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="flex flex-col gap-4">
      <Link
        href="/dashboard/checks"
        className="flex w-fit items-center gap-1 text-sm text-muted hover:text-foreground"
      >
        <ChevronRight className="size-4" />
        بازگشت به چک‌ها
      </Link>
      <div>
        <h1 className="text-lg font-semibold text-foreground">جزئیات چک</h1>
      </div>
      <CheckDetailCard checkId={id} />
    </div>
  );
}
