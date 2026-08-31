import { connectToDatabase } from "@/lib/db/connect";
import { requireAuthenticatedUser } from "@/lib/auth/api-guard";
import { apiSuccess } from "@/lib/utils/api-response";
import { getOrCreateWallet } from "@/lib/wallet/wallet-service";
import { WalletTransaction } from "@/models/WalletTransaction";

const RECENT_TRANSACTIONS_LIMIT = 20;

/**
 * کیف پول خود کاربر — بدون نیاز به Permission خاص، دقیقاً مثل Cart
 * (`requireAuthenticatedUser`). برای استفاده آینده Storefront (مثلاً
 * نمایش موجودی هنگام Checkout) از هم‌اکنون آماده است، بدون اینکه Cart
 * فعلاً مستقیماً به آن وصل باشد (نگاه کنید Known Issues در CLAUDE.md).
 */
export async function GET() {
  const guard = await requireAuthenticatedUser();
  if (guard.response) return guard.response;

  await connectToDatabase();
  const wallet = await getOrCreateWallet(guard.user.id);

  const transactions = await WalletTransaction.find({ user: guard.user.id })
    .sort({ createdAt: -1 })
    .limit(RECENT_TRANSACTIONS_LIMIT)
    .lean();

  return apiSuccess({
    balance: wallet.balance,
    transactions: transactions.map((t) => ({
      id: String(t._id),
      type: t.type,
      amount: t.amount,
      balanceAfter: t.balanceAfter,
      reason: t.reason,
      createdAt: t.createdAt,
    })),
  });
}
