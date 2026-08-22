import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { getCurrentUser } from "@/lib/auth/current-user";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Real authorization boundary — proxy.ts is only an optimistic
  // redirect and must never be trusted as the sole gatekeeper.
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?redirect=/dashboard");
  }

  if (user.role === "customer") {
    redirect("/");
  }

  return (
    <DashboardShell
      user={{
        fullName: user.fullName ?? null,
        phoneNumber: user.phoneNumber,
        role: user.role,
      }}
    >
      {children}
    </DashboardShell>
  );
}
