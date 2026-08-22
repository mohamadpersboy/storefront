import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { connectToDatabase } from "@/lib/db/connect";
import { User } from "@/models/User";
import { getCurrentUser } from "@/lib/auth/current-user";
import { UserDetailCard } from "@/components/users/user-detail-card";

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  await connectToDatabase();
  const [target, actor] = await Promise.all([
    User.findById(id).lean().catch(() => null),
    getCurrentUser(),
  ]);

  if (!target || !actor) {
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
      <UserDetailCard
        user={{
          id: String(target._id),
          fullName: target.fullName ?? null,
          phoneNumber: target.phoneNumber,
          role: target.role,
          isActive: target.isActive,
          createdAt: target.createdAt.toISOString(),
          lastLoginAt: target.lastLoginAt
            ? target.lastLoginAt.toISOString()
            : null,
        }}
        actorId={actor.id}
        actorRole={actor.role}
      />
    </div>
  );
}
