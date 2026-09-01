import type { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db/connect";
import { requireApiUser } from "@/lib/auth/api-guard";
import { PERMISSIONS } from "@/lib/constants/rbac";
import { apiSuccess } from "@/lib/utils/api-response";
import { WithdrawalRequest, type WithdrawalStatus } from "@/models/WithdrawalRequest";

const VALID_STATUSES: WithdrawalStatus[] = ["pending", "approved_paid", "rejected"];

export async function GET(request: NextRequest) {
  const guard = await requireApiUser(PERMISSIONS.WALLET_MANAGE);
  if (guard.response) return guard.response;

  const statusParam = request.nextUrl.searchParams.get("status");
  const filter: { status?: WithdrawalStatus } =
    statusParam && VALID_STATUSES.includes(statusParam as WithdrawalStatus)
      ? { status: statusParam as WithdrawalStatus }
      : {};

  await connectToDatabase();
  const withdrawals = await WithdrawalRequest.find(filter)
    .sort({ createdAt: -1 })
    .populate("user", "fullName phoneNumber")
    .lean();

  return apiSuccess(
    withdrawals.map((w) => {
      const user = w.user as unknown as { _id: unknown; fullName: string | null; phoneNumber: string };
      return {
        id: String(w._id),
        user: { id: String(user._id), fullName: user.fullName, phoneNumber: user.phoneNumber },
        amount: w.amount,
        destination: w.destination,
        status: w.status,
        reviewNote: w.reviewNote,
        createdAt: w.createdAt,
      };
    }),
  );
}
