import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { mockUsers } from "@/lib/mock/users";
import { UserDetailCard } from "@/components/users/user-detail-card";

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = mockUsers.find((u) => u.id === id);

  if (!user) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-4">
      <Link
        href="/dashboard/users"
        className="flex w-fit items-center gap-1 text-sm text-muted hover:text-foreground"
      >
        <ChevronRight className="size-4" />
        بازگشت به لیست کاربران
      </Link>
      <UserDetailCard user={user} />
    </div>
  );
}
