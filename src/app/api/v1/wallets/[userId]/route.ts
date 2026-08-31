import { connectToDatabase } from "@/lib/db/connect";
import { requireApiUser } from "@/lib/auth/api-guard";
import { PERMISSIONS } from "@/lib/constants/rbac";
import { apiSuccess } from "@/lib/utils/api-response";
import { getOrCreateWallet } from "@/lib/wallet/wallet-service";
import { WalletTransaction } from "@/models/WalletTransaction";

const RECENT_TRANSACTIONS_LIMIT = 50;

interface PopulatedPerformedBy {
  _id: unknown;
  fullName: string | null;
  phoneNumber: string;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const guard = await requireApiUser(PERMISSIONS.WALLET_READ);
  if (guard.response) return guard.response;

  const { userId } = await params;
  await connectToDatabase();

  const wallet = await getOrCreateWallet(userId);
  const transactions = await WalletTransaction.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(RECENT_TRANSACTIONS_LIMIT)
    .populate("performedBy", "fullName phoneNumber")
    .lean();

  return apiSuccess({
    balance: wallet.balance,
    transactions: transactions.map((t) => ({
      id: String(t._id),
      type: t.type,
      amount: t.amount,
      balanceAfter: t.balanceAfter,
      reason: t.reason,
      performedBy:
        t.performedBy && typeof t.performedBy === "object" && "phoneNumber" in t.performedBy
          ? {
              id: String((t.performedBy as unknown as PopulatedPerformedBy)._id),
              fullName: (t.performedBy as unknown as PopulatedPerformedBy).fullName,
              phoneNumber: (t.performedBy as unknown as PopulatedPerformedBy).phoneNumber,
            }
          : null,
      createdAt: t.createdAt,
    })),
  });
}
