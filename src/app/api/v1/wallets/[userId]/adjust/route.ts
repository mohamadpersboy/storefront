import { connectToDatabase } from "@/lib/db/connect";
import { requireApiUser } from "@/lib/auth/api-guard";
import { PERMISSIONS } from "@/lib/constants/rbac";
import { apiError, apiSuccess } from "@/lib/utils/api-response";
import { adjustWalletSchema } from "@/lib/validations/wallet";
import { adjustWalletBalance, WalletAdjustmentError } from "@/lib/wallet/wallet-service";
import { logActivity } from "@/lib/audit/log-activity";
import { User } from "@/models/User";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const guard = await requireApiUser(PERMISSIONS.WALLET_MANAGE);
  if (guard.response) return guard.response;
  const { user: actor } = guard;

  const { userId } = await params;

  const json = await request.json().catch(() => null);
  const parsed = adjustWalletSchema.safeParse(json);
  if (!parsed.success) {
    return apiError("اطلاعات ارسالی معتبر نیست", {
      status: 422,
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  await connectToDatabase();

  const targetUser = await User.findById(userId).lean();
  if (!targetUser) {
    return apiError("کاربر یافت نشد", { status: 404 });
  }

  try {
    const wallet = await adjustWalletBalance({
      userId,
      type: parsed.data.type,
      amount: parsed.data.amount,
      reason: parsed.data.reason,
      performedBy: actor.id,
    });

    await logActivity({
      actor,
      action: "wallet.adjusted",
      targetType: "Wallet",
      targetId: String(wallet._id),
      description: `${parsed.data.type === "credit" ? "افزایش" : "کاهش"} ${parsed.data.amount.toLocaleString("fa-IR")} تومانی کیف پول ${targetUser.phoneNumber} — دلیل: ${parsed.data.reason}`,
    });

    return apiSuccess(
      { balance: wallet.balance },
      { message: "موجودی کیف پول به‌روزرسانی شد" },
    );
  } catch (error) {
    if (error instanceof WalletAdjustmentError) {
      return apiError(error.message, { status: 422 });
    }
    throw error;
  }
}
